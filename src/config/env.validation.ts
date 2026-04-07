import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  MS_USER_URL: Joi.string().default('localhost:5001'),
  MS_POST_URL: Joi.string().default('localhost:5002'),
  MS_EVENT_URL: Joi.string().default('localhost:5003'),
});
