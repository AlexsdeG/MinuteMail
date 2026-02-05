import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Index, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Email } from '../../emails/entities/email.entity';

@Entity('aliases')
export class Alias {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  address: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Index()
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.aliases, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @OneToMany(() => Email, (email) => email.alias)
  emails: Email[];
}