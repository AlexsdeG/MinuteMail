import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SMTPServer, SMTPServerSession } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { Alias } from '../aliases/entities/alias.entity';
import { Email } from '../emails/entities/email.entity';
import { EmailsGateway } from '../gateway/emails.gateway';

interface CustomSession extends SMTPServerSession {
  acceptedAliases?: Alias[];
}

@Injectable()
export class SmtpService implements OnModuleInit, OnModuleDestroy {
  private server: SMTPServer;
  private readonly logger = new Logger(SmtpService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Alias)
    private aliasesRepository: Repository<Alias>,
    @InjectRepository(Email)
    private emailsRepository: Repository<Email>,
    private emailsGateway: EmailsGateway,
  ) {}

  onModuleInit() {
    this.server = new SMTPServer({
      authOptional: true,
      banner: '10-Min Mail Service',
      size: 10 * 1024 * 1024, // 10 MB limit
      disabledCommands: ['AUTH'],

      onConnect: (session, cb) => {
        this.logger.log(`New SMTP connection from ${session.remoteAddress}`);
        cb();
      },

      onRcptTo: async (address, session, cb) => {
        const recipientEmail = address.address;
        
        try {
          const alias = await this.aliasesRepository.findOne({
            where: { address: recipientEmail, isActive: true },
          });

          if (!alias) {
            return cb(new Error('550 Invalid recipient'));
          }

          if (alias.expiresAt < new Date()) {
            return cb(new Error('550 Alias expired'));
          }

          const customSession = session as CustomSession;
          if (!customSession.acceptedAliases) {
            customSession.acceptedAliases = [];
          }
          customSession.acceptedAliases.push(alias);
          
          cb();
        } catch (error) {
          this.logger.error(`Error validating recipient ${recipientEmail}`, error);
          cb(new Error('451 Temporary server error'));
        }
      },

      onData: (stream, session, cb) => {
        const customSession = session as CustomSession;
        const aliases = customSession.acceptedAliases || [];

        if (aliases.length === 0) {
          stream.resume();
          return cb(new Error('550 No valid recipients'));
        }

        simpleParser(stream, async (err, parsed) => {
          if (err) {
            this.logger.error('Error parsing email', err);
            return cb(new Error('554 Transaction failed'));
          }

          try {
            // Calculate approximate size
            const bodyText = parsed.text || '';
            const bodyHtml = (parsed.html as string) || '';
            const approxSize = bodyText.length + bodyHtml.length;

            const savePromises = aliases.map(async (alias) => {
              const newEmail = this.emailsRepository.create({
                alias: alias,
                sender: parsed.from?.text || 'unknown',
                subject: parsed.subject || '(No Subject)',
                bodyText: bodyText,
                bodyHtml: bodyHtml,
                sizeBytes: approxSize,
              });
              
              const savedEmail = await this.emailsRepository.save(newEmail);
              this.logger.log(`Email saved for alias ${alias.address}`);

              this.emailsGateway.server.to(`alias:${alias.id}`).emit('email_received', savedEmail);
            });

            await Promise.all(savePromises);
            cb();
          } catch (dbError) {
            this.logger.error('Error saving email to database', dbError);
            cb(new Error('451 Temporary server error'));
          }
        });
      },
    });

    const port = this.configService.get<number>('SMTP_PORT');
    this.server.listen(port, () => {
      this.logger.log(`SMTP Server listening on port ${port}`);
    });

    this.server.on('error', (err) => {
      this.logger.error('SMTP Server Error', err);
    });
  }

  onModuleDestroy() {
    if (this.server) {
      this.server.close(() => {
        this.logger.log('SMTP Server closed');
      });
    }
  }
}