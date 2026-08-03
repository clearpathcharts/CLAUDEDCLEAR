/**
 * ClearPath Social OS — standalone publisher service (own domain).
 * Not mounted on clearpathtrader.com.
 *
 * Dev:  npm run dev:social-os
 * Prod: npm run build:social-os && npm run start:social-os
 */
import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  createSocialOsRouter,
  startSocialOsScheduler,
  getSocialOsConfig,
} from '../src/server/socialOs';

dotenv.config();

/** Always resolve from repo / image working directory (npm scripts set cwd=/app). */
const SOCIAL_OS_ROOT = path.join(process.cwd(), 'social-os');
const CLIENT_DIR = path.join(SOCIAL_OS_ROOT, 'dist', 'client');
const VITE_CONFIG = path.join(SOCIAL_OS_ROOT, 'vite.config.ts');

const PORT = Number(process.env.PORT || process.env.SOCIAL_OS_PORT || 3010);
const PUBLIC_URL = (process.env.SOCIAL_OS_PUBLIC_URL || '').replace(/\/$/, '');

function allowedOrigins(): string[] {
  const fromEnv = (process.env.SOCIAL_OS_CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [PUBLIC_URL, 'http://localhost:3010', 'http://localhost:5174'].filter(Boolean) as string[];
  return [...new Set([...fromEnv, ...defaults])];
}

async function main() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        const allow = allowedOrigins();
        if (allow.length === 0 || allow.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked for origin ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/healthz', (_req, res) => {
    const cfg = getSocialOsConfig();
    res.json({
      ok: true,
      service: 'clearpath-social-os',
      middlemen: 'none',
      publicUrl: PUBLIC_URL || null,
      platformsConfigured: cfg.platformsConfigured,
      platformsTotal: cfg.platformsTotal,
      dryRun: cfg.dryRun,
    });
  });

  app.use('/api/social-os', createSocialOsRouter());

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    app.use(express.static(CLIENT_DIR, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(CLIENT_DIR, 'index.html'));
    });
  } else {
    // Dev: Vite middleware mode so UI + API share one port
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: VITE_CONFIG,
      server: { middlewareMode: true },
      appType: 'spa',
      root: SOCIAL_OS_ROOT,
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    const cfg = getSocialOsConfig();
    console.log(`[ClearPath Social OS] standalone on http://localhost:${PORT}`);
    if (PUBLIC_URL) console.log(`[ClearPath Social OS] public URL: ${PUBLIC_URL}`);
    console.log(
      `[ClearPath Social OS] middlemen=none credentials=${cfg.platformsConfigured}/${cfg.platformsTotal} dryRun=${cfg.dryRun}`
    );
    try {
      startSocialOsScheduler();
    } catch (e) {
      console.warn('[ClearPath Social OS] scheduler failed to start:', e);
    }
  });
}

void main();
