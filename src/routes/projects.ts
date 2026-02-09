import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import checkPermission from '../middleware/check_permission';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

// Tất cả routes đều cần auth
router.use(authMiddleware);

// GET /api/projects - Xem danh sách projects
router.get(
  '/',
  checkPermission({ requiredPermissions: [PERMISSIONS.PRJ_VIEW] }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Danh sách dự án',
      data: { projects: [] }
    });
  }
);

// POST /api/projects - Tạo project mới
router.post(
  '/',
  checkPermission({ requiredPermissions: [PERMISSIONS.PRJ_CREATE] }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Project đã được tạo'
    });
  }
);

// PUT /api/projects/:id - Cập nhật project
router.put(
  '/:id',
  checkPermission({ requiredPermissions: [PERMISSIONS.PRJ_UPDATE] }),
  (req, res) => {
    res.json({
      success: true,
      message: `Project ${req.params.id} đã được cập nhật`
    });
  }
);

// DELETE /api/projects/:id - Xóa project
router.delete(
  '/:id',
  checkPermission({ requiredPermissions: [PERMISSIONS.PRJ_DELETE] }),
  (req, res) => {
    res.json({
      success: true,
      message: `Project ${req.params.id} đã được xóa`
    });
  }
);

export default router;
