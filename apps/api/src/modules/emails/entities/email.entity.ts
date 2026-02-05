import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Alias } from '../../aliases/entities/alias.entity';

@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sender: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ name: 'body_text', type: 'text', nullable: true })
  bodyText: string;

  @Column({ name: 'body_html', type: 'text', nullable: true })
  bodyHtml: string;

  @CreateDateColumn({ name: 'received_at' })
  receivedAt: Date;

  @Column({ name: 'size_bytes', type: 'int', default: 0 })
  sizeBytes: number;

  @ManyToOne(() => Alias, (alias) => alias.emails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alias_id' })
  alias: Alias;
}