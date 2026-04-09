import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './server/db';
import authRoutes from './server/routes/auth';
import lotRoutes from './server/routes/lots';
import bookingRoutes from './server/routes/bookings';
import aiRoutes from './server/routes/ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  console.log('Starting server...');
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Global Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Initialize Database
  console.log('Initializing database...');
  try {
    initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }

  // Health Check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Routes
  console.log('Registering API routes...');
  app.use('/api/auth', (req, res, next) => {
    console.log(`Auth API request: ${req.method} ${req.url}`);
    next();
  }, authRoutes);
  app.use('/api/lots', lotRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/ai', aiRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Setting up Vite middleware...');
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use((req, res, next) => {
        console.log(`Falling through to Vite: ${req.method} ${req.url}`);
        next();
      });
      app.use(vite.middlewares);
      console.log('Vite middleware set up successfully');
    } catch (error) {
      console.error('Failed to set up Vite middleware:', error);
    }
  } else {
    // Production static file serving (if we were building for prod)
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
