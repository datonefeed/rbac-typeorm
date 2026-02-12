import { Response } from 'express';

type SuccessPayload<T> = {
  success: true;
  message: string;
  data?: T;
};

type ErrorPayload = {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
};

/**
 * Generic response function
 */
function respond<T>(res: Response, status: number, payload: SuccessPayload<T> | ErrorPayload) {
  return res.status(status).json(payload);
}

/**
 * Create error payload
 */
function errorPayload(message: string, errorCode: string, details?: unknown): ErrorPayload {
  return {
    success: false,
    message,
    errorCode,
    details,
  };
}

/**
 * Standardized HTTP response helpers
 */
export const httpResponse = {
  /**
   * 200 OK - Success response
   */
  ok: <T>(res: Response, message: string, data?: T) =>
    respond(res, 200, { success: true, message, data }),

  /**
   * 201 Created - Resource created successfully
   */
  created: <T>(res: Response, message: string, data?: T) =>
    respond(res, 201, { success: true, message, data }),

  /**
   * 204 No Content - Success with no response body
   */
  noContent: (res: Response) => res.status(204).send(),

  /**
   * 400 Bad Request - Invalid input
   */
  badRequest: (res: Response, message: string, details?: unknown) =>
    respond(res, 400, errorPayload(message, 'BAD_REQUEST', details)),

  /**
   * 401 Unauthorized - Authentication required
   */
  unauthorized: (res: Response, message: string, details?: unknown) =>
    respond(res, 401, errorPayload(message, 'UNAUTHORIZED', details)),

  /**
   * 403 Forbidden - Not enough permissions
   */
  forbidden: (res: Response, message: string, details?: unknown) =>
    respond(res, 403, errorPayload(message, 'FORBIDDEN', details)),

  /**
   * 404 Not Found - Resource not found
   */
  notFound: (res: Response, message: string, details?: unknown) =>
    respond(res, 404, errorPayload(message, 'NOT_FOUND', details)),

  /**
   * 409 Conflict - Resource conflict (e.g., duplicate)
   */
  conflict: (res: Response, message: string, details?: unknown) =>
    respond(res, 409, errorPayload(message, 'CONFLICT', details)),

  /**
   * 422 Unprocessable Entity - Validation error
   */
  unprocessableEntity: (res: Response, message: string, details?: unknown) =>
    respond(res, 422, errorPayload(message, 'VALIDATION_ERROR', details)),

  /**
   * 429 Too Many Requests - Rate limit exceeded
   */
  tooManyRequests: (res: Response, message: string, details?: unknown) =>
    respond(res, 429, errorPayload(message, 'TOO_MANY_REQUESTS', details)),

  /**
   * 500 Internal Server Error - Server error
   */
  serverError: (res: Response, message: string, details?: unknown) =>
    respond(res, 500, errorPayload(message, 'INTERNAL_SERVER_ERROR', details)),
};
