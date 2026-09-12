import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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

  async updatePreferredLocale(id: string, preferredLocale: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    user.preferredLocale = preferredLocale;
    return this.usersRepository.save(user);
  }
}
