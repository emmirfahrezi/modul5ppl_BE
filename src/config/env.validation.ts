import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('PPLM5'),

  // Database
  DATABASE_URL: Joi.string().default(''),
  DIRECT_URL: Joi.string().default(''),

  // JWT
  JWT_SECRET: Joi.string().default('pplm5-super-secret-jwt-key-change-this-in-production'),
  JWT_EXPIRATION: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().default('pplm5-super-secret-refresh-key-change-this-in-production'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('30d'),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),

  // API
  API_PREFIX: Joi.string().default('api/m5'),

  // Swagger
  SWAGGER_ENABLED: Joi.boolean().default(true),
  SWAGGER_PATH: Joi.string().default('docs'),
});
