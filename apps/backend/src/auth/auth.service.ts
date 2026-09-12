import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { AuthResponse, AuthUser, LoginPayload, SignupPayload } from "@muslimspaces/shared";
import { UsersService } from "../users/users.service";
import { UserEntity } from "../users/entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

  async updatePreferredLocale(userId: string, preferredLocale: string): Promise<AuthUser> {
    const user = await this.usersService.updatePreferredLocale(userId, preferredLocale);
    return this.toAuthUser(user);
  }

  private toAuthUser(user: UserEntity): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      preferredLocale: user.preferredLocale,
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
