import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { UpdateProfilePayload } from "@muslimspaces/shared";
import { UserEntity } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(email: string, passwordHash: string): Promise<UserEntity> {
    const user = this.usersRepository.create({ email, passwordHash });
    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, payload: UpdateProfilePayload): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (payload.displayName !== undefined) user.displayName = payload.displayName;
    if (payload.preferredLocale !== undefined) user.preferredLocale = payload.preferredLocale;
    if (payload.avatarKey !== undefined) user.avatarKey = payload.avatarKey;
    return this.usersRepository.save(user);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    user.passwordHash = passwordHash;
    await this.usersRepository.save(user);
  }
}
