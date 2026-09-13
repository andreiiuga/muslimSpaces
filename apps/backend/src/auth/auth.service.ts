import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordPayload,
  LoginPayload,
  SignupPayload,
  UpdateProfilePayload,
} from "@muslimspaces/shared";
import { UsersService } from "../users/users.service";
import { UserEntity } from "../users/entities/user.entity";
import { MediaService } from "../media/media.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mediaService: MediaService,
  ) {}

  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmail(payload.email);
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const passwordHash = await argon2.hash(payload.password);
    const user = await this.usersService.create(payload.email, passwordHash);
    return this.buildAuthResponse(user);
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(payload.email);
    if (!user || !(await argon2.verify(user.passwordHash, payload.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.buildAuthResponse(user);
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException("User not found");
    return this.toAuthUser(user);
  }

  async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<AuthUser> {
    const user = await this.usersService.updateProfile(userId, payload);
    return this.toAuthUser(user);
  }

  async changePassword(userId: string, payload: ChangePasswordPayload): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !(await argon2.verify(user.passwordHash, payload.currentPassword))) {
      throw new UnauthorizedException("Current password is incorrect");
    }
    const newHash = await argon2.hash(payload.newPassword);
    await this.usersService.updatePasswordHash(userId, newHash);
  }

  private toAuthUser(user: UserEntity): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      preferredLocale: user.preferredLocale,
      displayName: user.displayName ?? undefined,
      avatarUrl: user.avatarKey ? this.mediaService.urlsForKey(user.avatarKey).url : undefined,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private buildAuthResponse(user: UserEntity): AuthResponse {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: this.toAuthUser(user),
    };
  }
}
