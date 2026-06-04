import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const exists = await this.findByEmail(email);
    if (exists) throw new ConflictException('Email already in use');
    const user = this.userRepo.create({ email, passwordHash });
    return this.userRepo.save(user);
  }
}
