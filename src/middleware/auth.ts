import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token_utils';
import { parseAbilities } from '../utils/abilities';
import { extractToken } from '../utils/cookie';
import { httpResponse } from '../utils/http_response';
import { createModuleLogger } from '../config/logger';

interface AuthenticatedUser {
  userId: number;
  userName: string;
  email: string;
  abilities: string[]; 
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userAbilities?: any;
    }
  }
}

const logger = createModuleLogger('auth');

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    // Lấy token từ Authorization header hoặc cookie
    const token = extractToken(req);
    
    if (!token) {
      return httpResponse.unauthorized(res, 'Token không hợp lệ hoặc không được cung cấp');
    }

    // xac thực token
    const userData = await verifyAccessToken(token);
    
    if (!userData) {
      return httpResponse.unauthorized(res, 'Token không hợp lệ hoặc đã hết hạn', { code: 'TOKEN_INVALID' });
    }

    // Gắn thông tin user vào request
    req.user = {
      userId: userData.userId,
      userName: userData.userName,
      email: userData.email,
      abilities: userData.abilities
    };

    // Chuyển abilities thành định dạng có cấu trúc để dễ kiểm tra quyền
    req.userAbilities = parseAbilities(userData.abilities);

    next();
  } catch (error) {
    logger.error({ err: error }, '[authMiddleware] Error');
    return httpResponse.serverError(res, 'Lỗi xác thực');
  }
}
