import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import checkPermission from '../middleware/check_permission';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

// Tất cả routes admin đều cần auth
router.use(authMiddleware);

// GET /api/admin/users
router.get(
  '/users',
  checkPermission({ requiredPermissions: [PERMISSIONS.USER_VIEW] }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Danh sách users',
      data: { users: [] }
    });
  }
);

// POST /api/admin/users/:userId/roles
router.post(
  '/users/:userId/roles',
  checkPermission({ requiredPermissions: [PERMISSIONS.USER_UPDATE] }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Roles đã được gán'
    });
  }
);

// GET /api/admin/roles
router.get(
  '/roles',
  checkPermission({ requiredPermissions: [PERMISSIONS.ROLE_VIEW] }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Danh sách roles',
      data: { roles: [] }
    });
  }
);

// GET /api/admin/permissions
router.get(
  '/permissions',
  checkPermission({ requiredPermissions: [PERMISSIONS.PERMISSION_VIEW] }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Danh sách permissions',
      data: { permissions: [] }
    });
  }
);

export default router;
