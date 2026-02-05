import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alias } from './entities/alias.entity';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class AliasesService {
  constructor(
    @InjectRepository(Alias)
    private aliasesRepository: Repository<Alias>,
    private configService: ConfigService,
  ) {}

  private generateRandomString(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  async create(user: User | null, customSlug?: string): Promise<Alias> {
    const domain = this.configService.get<string>('DOMAIN');
    let address = '';
    
    if (customSlug) {
      address = `${customSlug}@${domain}`;
      const existing = await this.aliasesRepository.findOne({ where: { address } });
      if (existing) {
        throw new BadRequestException('Alias is already taken.');
      }
    } else {
      let isUnique = false;
      // Retry loop to ensure uniqueness for random strings
      while (!isUnique) {
        const randomPart = this.generateRandomString(8);
        address = `${randomPart}@${domain}`;
        const existing = await this.aliasesRepository.findOne({ where: { address } });
        if (!existing) {
          isUnique = true;
        }
      }
    }

    const now = new Date();
    let expiresAt: Date;

    if (user) {
      // Registered User: 7 Days
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // Guest: 10 Minutes
      expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    }

    const alias = this.aliasesRepository.create({
      address,
      expiresAt,
      user,
      isActive: true,
    });

    return this.aliasesRepository.save(alias);
  }

  async findAllForUser(user: User): Promise<Alias[]> {
    return this.aliasesRepository.find({
      where: { 
        userId: user.id,
        isActive: true
      },
      order: {
        expiresAt: 'DESC'
      }
    });
  }

  async extend(id: string, user: any) {
    const alias = await this.aliasesRepository.findOne({ where: { id } });
    if (!alias) throw new NotFoundException('Alias not found');

    // Ownership check
    if (alias.userId && (!user || alias.userId !== user.userId)) {
      throw new ForbiddenException('You do not own this alias');
    }

    const now = new Date();
    const currentExpiry = alias.expiresAt > now ? alias.expiresAt : now;
    
    if (user) {
      // Users can extend up to 1 month max from now
      // Simple logic: Add 7 days
      alias.expiresAt = new Date(currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // Guests can extend by 10 mins, max 1 hour total? 
      // Simplified: Just set to 10 mins from now
      alias.expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    }
    
    // Reactivate if expired
    alias.isActive = true; 

    return this.aliasesRepository.save(alias);
  }

  async delete(id: string, user: any) {
    const alias = await this.aliasesRepository.findOne({ where: { id } });
    if (!alias) throw new NotFoundException('Alias not found');

    if (alias.userId && (!user || alias.userId !== user.userId)) {
      throw new ForbiddenException('You do not own this alias');
    }

    alias.isActive = false;
    return this.aliasesRepository.save(alias);
  }
}