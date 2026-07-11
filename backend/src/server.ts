import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { config } from './config/env';
import { redisClient } from './config/redis';
import { errorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rate-limit.middleware';

import authRoutes       from './routes/auth.routes';
import usersRoutes      from './routes/users.routes';
import rolesRoutes      from './routes/roles.routes';
import permissionsRoutes from './routes/permissions.routes';
import dashboardRoutes  from './routes/dashboard.routes';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,             // Required for HttpOnly cookie exchange
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
}));

// ── Body / cookie parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/users',       usersRoutes);
app.use('/api/roles',       rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/dashboard',   dashboardRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', env: config.env }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ status: 404, message: 'Route not found.' }));

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export { app };

// Start only when this file is the entry point (not during tests)
if (process.env['NODE_ENV'] !== 'test') {
  redisClient.connect()
    .then(() => {
      console.log(`✅  Redis connected  [${config.redis.url}]`);
      app.listen(config.port, () => {
        console.log(`✅  Auth backend running on http://localhost:${config.port}  [${config.env}]`);
      });
    })
    .catch((err: Error) => {
      console.error('❌  Redis connection failed:', err.message);
      process.exit(1);
    });
}
