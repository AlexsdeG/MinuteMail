# Prisma Migration Guide for MinuteMail API

## Overview
This API has been migrated from **TypeORM** to **Prisma** for database management. This guide explains the changes and how to set up the application.

## Key Changes

### 1. **Database Configuration**
- **Old**: Individual environment variables (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`)
- **New**: Single `DATABASE_URL` environment variable

### 2. **Removed Packages**
- `@nestjs/typeorm`
- `typeorm`

### 3. **Added Packages**
- `@prisma/client` - Prisma Client for database operations
- `prisma` - Prisma CLI for migrations and schema management

### 4. **Database Schema**
The Prisma schema is located in `prisma/schema.prisma` with the following models:
- **User**: Registered users
- **Alias**: Temporary email addresses
- **Email**: Received emails

## Setup Instructions

### 1. Update Environment Variables

Replace the individual PostgreSQL variables with a single `DATABASE_URL`:

```env
# Remove these:
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=postgres
# POSTGRES_DB=mail_service

# Add this instead:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mail_service"

# Keep these as-is:
PORT=3010
SMTP_PORT=2525
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=super_secret_key
DOMAIN=localhost
REGISTER=false
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Prisma Migrations

To create the database and apply migrations:

```bash
# Generate Prisma Client
pnpm dlx prisma generate

# Create/update database schema
pnpm dlx prisma migrate dev --name init

# Or if you already have a database with existing schema, use:
pnpm dlx prisma db push
```

### 4. Optional: Seed the Database

If you have a seed file, run:

```bash
pnpm run prisma:seed
```

## Development with Prisma

### View Database in Prisma Studio

```bash
pnpm dlx prisma studio
```

### Generate Prisma Client after schema changes

```bash
pnpm dlx prisma generate
```

### Create a new migration

```bash
pnpm dlx prisma migrate dev --name <migration_name>
```

## API Changes

### Service Injection
Services now use `PrismaService` instead of `InjectRepository`:

```typescript
// Old (TypeORM):
constructor(@InjectRepository(User) private repo: Repository<User>) {}

// New (Prisma):
constructor(private prisma: PrismaService) {}
```

### Database Queries
Prisma uses a fluent API different from TypeORM:

```typescript
// Old (TypeORM):
await this.repo.findOne({ where: { id } });
await this.repo.find({ where: { userId: id } });
await this.repo.save(entity);

// New (Prisma):
await this.prisma.user.findUnique({ where: { id } });
await this.prisma.user.findMany({ where: { userId: id } });
await this.prisma.user.create({ data: entity });
```

## Module Structure

All modules have been updated to remove TypeORM imports:

**Before:**
```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  providers: [Service],
})
```

**After:**
```typescript
@Module({
  providers: [Service],
})
// PrismaService is globally available via PrismaModule
```

## Database Connection

The application now uses:
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Connection**: Via `DATABASE_URL` environment variable
- **Automatic Migrations**: Use Prisma Migrate for schema management

## Troubleshooting

### Error: "DATABASE_URL is not set"
Make sure your `.env` file contains the `DATABASE_URL` variable.

### Error: "Migration pending"
Run `pnpm dlx prisma migrate deploy` to apply pending migrations.

### Error: "Prisma Client not generated"
Run `pnpm dlx prisma generate` to regenerate the Prisma Client.

### Need to reset database?
```bash
# ⚠️ Warning: This deletes all data!
pnpm dlx prisma migrate reset
```

## Benefits of Prisma

1. **Type-safe**: Generated Prisma Client with full TypeScript support
2. **Intuitive API**: Fluent query builder
3. **Migration Management**: Built-in migration system
4. **Studio**: Visual database browser
5. **Better Performance**: Optimized queries and connection pooling

## Further Reading

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma NestJS Guide](https://docs.prisma.io/guides/database/using-prisma-with-nodejs#setting-up-prisma)
