import { z } from 'zod';

// Environment configuration schema
const envSchema = z.object({
  // Server configuration
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // JWT configuration
  JWT_SECRET: z.string().min(32).default('default-jwt-secret-change-in-production-32chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  
  // CORS configuration
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // AI Provider Keys (optional, users can provide their own)
  DEEPSEEK_API_KEY: z.string().optional(),
  DASHSCOPE_API_KEY: z.string().optional(),
  
  // WeChat API proxy target
  WECHAT_API_BASE: z.string().default('https://api.weixin.qq.com'),
  
  // Admin configuration (for seeding initial admin user)
  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: z.string().min(6).default('admin123'),
  ADMIN_NAME: z.string().default('Administrator'),
});

// Parse and validate environment variables
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }
  
  return result.data;
};

export const config = parseEnv();

export type Config = typeof config;
