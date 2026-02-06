# Build stage
FROM node:20-alpine AS builder

# Install native dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy source
COPY . .

# Install dependencies and generate Prisma client
RUN pnpm install
RUN npx prisma generate

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner

# Install native dependencies for Prisma in runner stage
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

RUN npm install -g pnpm

# Copy only the necessary files from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Ensure entrypoint is executable
RUN chmod +x ./entrypoint.sh

# Set environment variables
ENV NODE_ENV=production

# Expose ports
EXPOSE 3010
EXPOSE 578

# Use entrypoint script to run migrations and start the app
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/src/main"]

