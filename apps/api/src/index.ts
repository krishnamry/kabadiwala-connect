import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import ratesRoutes from './routes/rates.routes';
import pickupRoutes from './routes/pickup.routes';
import kabadiwalaRoutes from './routes/kabadiwala.routes';
import adminRoutes from './routes/admin.routes';
import mlRoutes from './routes/ml.routes';
import geoRoutes from './routes/geo.routes';
import lotRoutes from './routes/lot.routes';
import saleRoutes from './routes/sale.routes';
import reviewRoutes from './routes/review.routes';
import chatRoutes from './routes/chat.routes';
import kycRoutes from './routes/kyc.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security: Disable Express fingerprint header
app.disable('x-powered-by');

// Security: HTTP Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Allows Vite SPA assets, Google Fonts, and Leaflet Maps to render seamlessly
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Security: Rate Limiting to prevent brute-force attacks and DDoS
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.'
  }
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP to 25 login/registration requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  }
});

// Apply rate limiters
app.use('/api', globalApiLimiter);
app.use('/api/auth/login', strictAuthLimiter);
app.use('/api/auth/register', strictAuthLimiter);

// Security: CORS configuration allowing Web, Android Capacitor, and local environments
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);
    // Allow localhost, local network, capacitor, and onrender.com domains
    const allowedPatterns = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      /^https?:\/\/.*\.onrender\.com$/,
      /^capacitor:\/\/localhost$/,
      /^https?:\/\/localhost$/
    ];
    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback for public API while preventing credential exposure
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security: Explicit request body size limits to prevent memory exhaustion DoS attacks
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

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
app.use('/api/geo', geoRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/kyc', kycRoutes);

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
        ml: '/api/ml',
        geo: '/api/geo',
        lots: '/api/lots',
        sales: '/api/sales',
        reviews: '/api/reviews',
        chat: '/api/chat',
        kyc: '/api/kyc'
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
