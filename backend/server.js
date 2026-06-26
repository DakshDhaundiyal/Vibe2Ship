// =============================================================================
// server.js — Community Hero Backend
// =============================================================================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import reportsRouter from './routes/reports.js';
import insightsRouter from './routes/insights.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://community-hero-app.vercel.app' // production (update when deployed)
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/reports', reportsRouter);
app.use('/api/insights', insightsRouter);

// ---------------------------------------------------------------------------
// 404 handler (and React Router fallback)
// ---------------------------------------------------------------------------
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Anything that doesn't match an API route goes to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  });
}

// ---------------------------------------------------------------------------
// Global error handler — ensures no unhandled exceptions reach the client
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    error: 'An unexpected server error occurred. Please try again.'
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════╗
║       Community Hero Backend              ║
║       Running on port ${PORT}                ║
╚═══════════════════════════════════════════╝
  `);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Reports: http://localhost:${PORT}/api/reports`);
});

export default app;
