import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:4200',
  jwt: {
    accessSecret:  process.env['JWT_ACCESS_SECRET']  ?? 'fallback-access-secret-min-32-chars!!',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] ?? 'fallback-refresh-secret-min-32-chars!',
    accessExpiresIn:  process.env['JWT_ACCESS_EXPIRES_IN']  ?? '30s',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
  },
  cookie: {
    secure:   process.env['COOKIE_SECURE'] === 'true',
    sameSite: (process.env['COOKIE_SAME_SITE'] as 'Lax' | 'Strict' | 'None') ?? 'Lax',
  },
  redis: {
    url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  },
} as const;
