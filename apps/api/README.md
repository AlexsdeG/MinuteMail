
# Enviroment

PORT=3010
SMTP_PORT=2525

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mail_service

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=super_secret_key
DOMAIN=localhost
REGISTER=false



#### Generate JWT

openssl rand -base64 32
