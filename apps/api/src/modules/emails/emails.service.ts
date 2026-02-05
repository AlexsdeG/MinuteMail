import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Email } from './entities/email.entity';
import { Alias } from '../aliases/entities/alias.entity';

@Injectable()
export class EmailsService {
  constructor(
    @InjectRepository(Email)
    private emailsRepository: Repository<Email>,
    @InjectRepository(Alias)
    private aliasesRepository: Repository<Alias>,
  ) {}

  async findAllByAlias(aliasId: string, user: any) {
    const alias = await this.aliasesRepository.findOne({ where: { id: aliasId } });
    if (!alias) throw new NotFoundException('Alias not found');

    // Security Check:
    // 1. If Alias belongs to a user, requester MUST be that user.
    // 2. If Alias is anonymous (Guest), anyone with the ID can read (Standard Disposable Mail behavior).
    if (alias.userId && (!user || alias.userId !== user.userId)) {
      throw new ForbiddenException('You do not own this alias');
    }

    return this.emailsRepository.find({
      where: { alias: { id: aliasId } },
      order: { receivedAt: 'DESC' },
      select: ['id', 'sender', 'subject', 'receivedAt', 'sizeBytes'], // Exclude body for list view
    });
  }

  async findOne(id: string, user: any) {
    const email = await this.emailsRepository.findOne({ 
      where: { id }, 
      relations: ['alias'] 
    });
    
    if (!email) throw new NotFoundException('Email not found');

    if (email.alias.userId && (!user || email.alias.userId !== user.userId)) {
      throw new ForbiddenException('Access denied');
    }

    return email;
  }

  async delete(id: string, user: any) {
    const email = await this.findOne(id, user); // Perform lookup & auth check
    return this.emailsRepository.remove(email);
  }
}