import pino from 'pino';
import type { LoggerOptions } from 'pino';
import path from 'path';
import fs from 'fs';

const isDevelopment = process.env.NODE_ENV === 'development';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'storage', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Pino logger configuration
 */
const pinoConfig: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  // Development: Pretty print with colors to console + file
  // Production: JSON format to file only
  transport: isDevelopment
    ? {
        targets: [
          // Console with pretty print
          {
            target: 'pino-pretty',
            level: 'debug',
            options: {
              colorize: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname',
              singleLine: false,
              messageFormat: '{if module}[{module}] {end}{msg}',
            },
          },
          // File logging - all logs
          {
            target: 'pino/file',
            level: 'info',
            options: {
              destination: path.join(logsDir, 'app.log'),
              mkdir: true,
            },
          },
          // File logging - errors only
          {
            target: 'pino/file',
            level: 'error',
            options: {
              destination: path.join(logsDir, 'error.log'),
              mkdir: true,
            },
          },
        ],
      }
    : {
        targets: [
          // Production: JSON to files only
          {
            target: 'pino/file',
            level: 'info',
            options: {
              destination: path.join(logsDir, 'app.log'),
            },
          },
          {
            target: 'pino/file',
            level: 'error',
            options: {
              destination: path.join(logsDir, 'error.log'),
            },
          },
        ],
      },

  // Custom serializers
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers?.host,
        'user-agent': req.headers?.[' user-agent'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },

  // Base fields for all logs
  base: {
    env: process.env.NODE_ENV || 'development',
  },
};

/**
 * Application logger instance
 */
export const logger = pino(pinoConfig);

/**
 * Child logger factory - for module-specific logging
 */
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};
