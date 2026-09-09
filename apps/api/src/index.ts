import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import ratesRoutes from './routes/rates.routes';
import pickupRoutes from './routes/pickup.routes';
import kabadiwalaRoutes from './routes/kabadiwala.routes';
import adminRoutes from './routes/admin.routes';
import mlRoutes from './routes/ml.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import path from 'path';
import fs from 'fs';

// Root and healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static build if available
const possibleStaticDirs = [
  path.resolve(__dirname, '../../../apps/web/dist'),
  path.resolve(__dirname, '../../web/dist'),
  path.resolve(__dirname, '../web/dist'),
  path.resolve(process.cwd(), 'apps/web/dist'),
  path.resolve(process.cwd(), 'dist')
];
const staticDir = possibleStaticDirs.find(d => fs.existsSync(d) && fs.existsSync(path.join(d, 'index.html')));

if (staticDir) {
  app.use(express.static(staticDir));
}

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/kabadiwala', kabadiwalaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ml', mlRoutes);

// SPA fallback or API root info
if (staticDir) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'Kabadiwala Connect API',
      version: '1.0.0',
      status: 'online',
      endpoints: {
        auth: '/api/auth',
        pickups: '/api/pickups',
        rates: '/api/rates',
        kabadiwala: '/api/kabadiwala',
        admin: '/api/admin',
        ml: '/api/ml'
      }
    });
  });
}

// Centralized error handler
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Kabadiwala Connect Backend API running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
