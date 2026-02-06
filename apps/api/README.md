
# MinuteMail API

NestJS Backend API for the 10-Minute Mail Service. This API provides email aliasing, SMTP receiving, and WebSocket real-time updates.

## Database Setup

This API now uses **Prisma** as the ORM. See [PRISMA_MIGRATION.md](./PRISMA_MIGRATION.md) for detailed migration information.

### Environment Variables

```env
# Database Configuration (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mail_service"

# Server Configuration
PORT=3010
SMTP_PORT=2525

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=super_secret_key

# Application Configuration
DOMAIN=localhost
REGISTER=false

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_MAIL_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=noreply@example.com
```

### Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up database**
   ```bash
   pnpm dlx prisma migrate dev --name init
   ```

3. **Start development server**
   ```bash
   pnpm run dev
   ```

### Available Scripts

- `pnpm run dev` - Start development server with watch mode
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Lint and fix code
- `pnpm run format` - Format code with Prettier
- `pnpm run test` - Run unit tests
- `pnpm run test:e2e` - Run end-to-end tests
- `pnpm run test:infra` - Test database connection

### Docker Support

You can run the API, PostgreSQL, and Redis using Docker Compose:

1. **Configure Environment**
   - The `docker-compose.yml` uses pre-configured values for local services.
   - You can override SMTP settings in the `environment` section or via a `.env` file.

2. **Start Services**
   ```bash
   docker-compose up -d --build
   ```

3. **Check Status**
   ```bash
   docker-compose ps
   docker-compose logs -f api
   ```

4. **Ports**
   - API: `3010`
   - Incoming SMTP: `578` (as requested)
   - PostgreSQL: `5432`
   - Redis: `6379`


### Prisma Commands

- `pnpm dlx prisma generate` - Generate Prisma Client
- `pnpm dlx prisma studio` - Open Prisma Studio (visual DB browser)
- `pnpm dlx prisma migrate dev` - Create and apply migrations
- `pnpm dlx prisma db push` - Sync schema with database

### JWT Secret Generation

```bash
openssl rand -base64 32
```

## Architecture

### Modules

- **Auth** - User authentication and JWT tokens
- **Users** - User management
- **Aliases** - Email alias creation and management
- **Emails** - Email storage and retrieval
- **SMTP** - SMTP server for receiving emails
- **Gateway** - WebSocket gateway for real-time updates
- **Cleanup** - Scheduled cleanup of expired aliases and old emails
- **Prisma** - Database connection management

### Key Features

- ✅ User registration and login
- ✅ Email alias generation (random or custom)
- ✅ SMTP email receiving
- ✅ Real-time email notifications via WebSocket
- ✅ Automatic cleanup of expired aliases
- ✅ Rate limiting (5 requests per 60 seconds)
- ✅ JWT-based authentication
- ✅ Configurable registration toggle

## Database Schema

See `prisma/schema.prisma` for the complete schema. Main models:

- **User** - Registered users
- **Alias** - Temporary email addresses
- **Email** - Received emails

For detailed information about the Prisma migration, see [PRISMA_MIGRATION.md](./PRISMA_MIGRATION.md).
