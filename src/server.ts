import 'reflect-metadata';
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import * as dotenv from 'dotenv';
import { initializeDatabase } from './config/typeorm';
import { logger } from './config/logger';
import { httpResponse } from './utils/http_response';
import { errorHandler, notFoundHandler } from './middleware/error_handler';

// Import routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import projectRoutes from './routes/projects';
import userRoutes from './routes/user_routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pino HTTP logger
app.use(pinoHttp({ logger }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  return httpResponse.ok(res, 'Server is healthy', {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database initialized successfully');
    
    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
