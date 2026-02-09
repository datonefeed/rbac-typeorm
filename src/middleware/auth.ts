import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token_utils';
import { parseAbilities } from '../utils/abilities';

interface AuthenticatedUser {
  userId: number;
  userName: string;
  email: string;
  abilities: string[]; // Format: ['DIRECTOR', 'company:1', 'permission:PRJ_VIEW']
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userAbilities?: any;
    }
  }
}

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc không được cung cấp'
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    // xac thực token
    const userData = await verifyAccessToken(token);
    
    if (!userData) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
        code: 'TOKEN_INVALID'
      });
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
    console.error('[authMiddleware] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}
