import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, pass: string): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(pass, salt);

    const newUser = this.usersRepository.create({ email, password });
    return this.usersRepository.save(newUser);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();
    
    return user || undefined;
  }
}