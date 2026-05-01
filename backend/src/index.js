require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Socket Helper
const socketHelper = require('./socket');

// Route imports
const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kycRoutes');
const bookingRoutes = require('./routes/bookings');
const providerRoutes = require('./routes/providers');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const notificationRoutes = require('./routes/notifications');
const subscriptionRoutes = require('./routes/subscriptions');
const labRoutes = require('./routes/labs.js');
const partnerLabRoutes = require('./routes/partnerLabs.js');
const adminLabRoutes = require('./routes/adminLabs.js');
const reconciliationRoutes = require('./routes/reconciliation.js');
const pricingRoutes = require('./routes/pricingRoutes');

const app = express();

// Connect to MongoDB
connectDB();

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// ── Middleware ──────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.error(`[CORS] Blocked request from: ${origin}`);
    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

// Rate limiting (Global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// Auth specific strictly limited rate-limiter for login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, // Strict limit to prevent brute force
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes.' }
});

// More generous limiter for profile/avatar updates
const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many profile updates, please try again later.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/profile', profileUpdateLimiter);
app.use('/api/auth/avatar', profileUpdateLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // Prevent NoSQL injections globally

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── Sitemap (Dynamic XML) ───────────────────────────────────
app.get('/sitemap.xml', require('./controllers/sitemapController').generateSitemap);

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/partner/lab', partnerLabRoutes);
app.use('/api/admin/labs', adminLabRoutes);
app.use('/api/admin/labs/reconciliation', reconciliationRoutes);
app.use('/api/pricing', pricingRoutes);

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'up', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Central error handler ──────────────────────────────────
app.use(errorHandler);

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 RIVO API running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
  // Environment initialized successfully
});

// ── Initialize Socket.io ────────────────────────────────────
socketHelper.init(server, allowedOrigins);

// ── Initialize Cron Jobs ────────────────────────────────────
const { startCron } = require('../cron/reassignment');
startCron();

module.exports = app;
