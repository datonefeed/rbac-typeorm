import { Request, Response, NextFunction } from 'express';
import { hasAccess } from '../utils/abilities';

interface CheckPermissionOptions {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requiredCompanies?: number[];
  requireAll?: boolean;
}

export default function checkPermission(options: CheckPermissionOptions = {}) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    // Kiểm tra đã có userAbilities chưa (đã qua authMiddleware chưa)
    if (!req.userAbilities) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực'
      });
    }

    // Check quyền
    const allowed = hasAccess(req.userAbilities, options);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    next();
  };
}
