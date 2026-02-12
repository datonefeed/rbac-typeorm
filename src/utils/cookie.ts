import { Request, Response } from 'express';

// Cookie configuration từ environment variables
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mt_auth';
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;
const COOKIE_SAME_SITE = (process.env.AUTH_COOKIE_SAME_SITE || 'lax') as 'strict' | 'lax' | 'none';
const COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
const COOKIE_MAX_AGE = parseInt(process.env.AUTH_COOKIE_MAX_AGE || '604800000', 10); // 7 days default

/**
 * Set authentication token in HTTP-only cookie
 * @param res Express Response object
 * @param token Authentication token
 * @param expiresAt Optional expiration date/time
 */
export function setAuthCookie(
  res: Response,
  token: string,
  expiresAt?: string | Date | null
): void {
  const options: {
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    secure: boolean;
    path: string;
    domain?: string;
    expires?: Date;
    maxAge?: number;
  } = {
    httpOnly: true,
    sameSite: COOKIE_SAME_SITE,
    secure: COOKIE_SECURE,
    path: '/',
  };

  // Thêm domain nếu có cấu hình
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }

  // Set expires date nếu có
  if (expiresAt) {
    options.expires = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  } else {
    // Nếu không có expiresAt, dùng maxAge
    options.maxAge = COOKIE_MAX_AGE;
  }

  res.cookie(COOKIE_NAME, token, options);
}

/**
 * Clear authentication cookie (for logout)
 * @param res Express Response object
 */
export function clearAuthCookie(res: Response): void {
  const options: {
    path: string;
    domain?: string;
  } = {
    path: '/',
  };

  // Phải match domain khi clear cookie
  if (COOKIE_DOMAIN) {
    options.domain = COOKIE_DOMAIN;
  }

  res.clearCookie(COOKIE_NAME, options);
}

/**
 * Extract authentication token from cookie
 * @param req Express Request object
 * @returns Token string or undefined
 */
export function extractAuthCookie(req: Request): string | undefined {
  return req.cookies?.[COOKIE_NAME];
}

/**
 * Extract token from either Authorization header or cookie
 * Prioritizes Authorization header, falls back to cookie
 * @param req Express Request object
 * @returns Token string or undefined
 */
export function extractToken(req: Request): string | undefined {
  // 1. Try Authorization header first (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Fall back to cookie
  return extractAuthCookie(req);
}
