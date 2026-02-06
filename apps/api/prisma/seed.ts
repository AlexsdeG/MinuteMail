import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a test user (optional)
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('password123', salt);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
    },
  });

  console.log('Created user:', user);

  // Optionally create test aliases
  const alias = await prisma.alias.upsert({
    where: { address: 'test@localhost' },
    update: {},
    create: {
      address: 'test@localhost',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      userId: user.id,
      isActive: true,
      emails: {
        create: {
          sender: 'sender@example.com',
          subject: 'Test Email',
          bodyText: 'This is a test email',
          bodyHtml: '<p>This is a test email</p>',
          sizeBytes: 100,
        },
      },
    },
  });

  console.log('Created alias:', alias);

  // Optionally create a test email



}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
