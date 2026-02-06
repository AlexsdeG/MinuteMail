import * as Joi from 'joi';

export const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  SMTP_PORT: Joi.number().default(2525),
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  JWT_SECRET: Joi.string().required(),
  REGISTER: Joi.boolean().default(false),
  CLIENT_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().optional(),
});