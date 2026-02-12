import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppError } from '../errors/app_error';
import { httpResponse } from '../utils/http_response';
import { createModuleLogger } from '../config/logger';

const logger = createModuleLogger('error-handler');

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }
  // Handle TypeORM errors
  else if (err instanceof QueryFailedError) {
    statusCode = 500;
    message = 'Database error';
    details = process.env.NODE_ENV === 'development' ? err.message : undefined;
  }
  // Handle JSON parsing errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON';
  }

  // Log errors
  if (statusCode >= 500) {
    logger.error(
      {
        err,
        method: req.method,
        url: req.url,
        body: sanitizeBody(req.body),
        statusCode,
      },
      message
    );
  } else {
    logger.warn({ method: req.method, url: req.url, statusCode }, message);
  }

  // Send response
  const responseDetails = process.env.NODE_ENV === 'development' ? details : undefined;

  const responseMap: Record<number, Function> = {
    400: httpResponse.badRequest,
    401: httpResponse.unauthorized,
    403: httpResponse.forbidden,
    404: httpResponse.notFound,
    409: httpResponse.conflict,
    422: httpResponse.unprocessableEntity,
    429: httpResponse.tooManyRequests,
  };

  const responseHandler = responseMap[statusCode] || httpResponse.serverError;
  return responseHandler(res, message, responseDetails);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not Found Handler
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  return httpResponse.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
};

/**
 * Sanitize sensitive data from logs
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];
  const sanitized = { ...body };

  sensitiveFields.forEach((field) => {
    if (field in sanitized) sanitized[field] = '[REDACTED]';
  });

  return sanitized;
}
