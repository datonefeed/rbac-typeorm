/**
 * Custom Application Error Classes
 * Extends base Error to provide structured error handling
 */

import { HttpStatus } from '../constants/http_status';
import { ErrorCode } from '../constants/error_codes';

/**
 * Base Application Error
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: ErrorCode;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly for TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 400 Bad Request
 * Client sent invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(message, HttpStatus.BAD_REQUEST, true, ErrorCode.BAD_REQUEST, details);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized
 * Authentication required or failed
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, HttpStatus.UNAUTHORIZED, true, ErrorCode.UNAUTHORIZED, details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden
 * User doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, HttpStatus.FORBIDDEN, true, ErrorCode.FORBIDDEN, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found
 * Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, HttpStatus.NOT_FOUND, true, ErrorCode.NOT_FOUND, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict
 * Resource already exists or conflict state
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', details?: any) {
    super(message, HttpStatus.CONFLICT, true, ErrorCode.CONFLICT, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, true, ErrorCode.VALIDATION_ERROR, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 429 Too Many Requests
 * Rate limiting
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, true, ErrorCode.TOO_MANY_REQUESTS, details);
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

/**
 * 500 Internal Server Error
 * Unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, false, ErrorCode.INTERNAL_SERVER_ERROR, details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 503 Service Unavailable
 * Service temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', details?: any) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, true, ErrorCode.SERVICE_UNAVAILABLE, details);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Database Error
 * Database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, false, ErrorCode.DATABASE_ERROR, details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}
