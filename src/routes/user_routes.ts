import { Router } from 'express';
import  auth  from '../middleware/auth';
import {
  getUserList,
  getUserById,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  assignRolesHandler,
  assignCompaniesHandler,
  changePasswordHandler,
} from '../controllers/user_controller';
import {
  validateRequest,
  getUserListQuerySchema,
  userIdParamSchema,
  createUserBodySchema,
  updateUserBodySchema,
  assignRolesBodySchema,
  assignCompaniesBodySchema,
  changePasswordBodySchema,
} from '../validators/user_validators';

/**
 * User Routes
 * Định nghĩa routes + middleware (auth + validation)
 * 
 * TODO: Thêm require_ability middleware khi cần kiểm tra permissions
 * Ví dụ: auth, requireAbility(['permission:USER_VIEW'])
 */

const router = Router();

/**
 * GET /users - List users với cursor pagination
 * Auth: required
 * Query: limit, afterCursor, beforeCursor, order, search, isActive, roleId, companyId
 */
router.get(
  '/',
  auth,
  validateRequest(getUserListQuerySchema, 'query'),
  getUserList
);

/**
 * GET /users/:user_id - Get user detail
 * Auth: required
 * Params: user_id
 */
router.get(
  '/:user_id',
  auth,
  validateRequest(userIdParamSchema, 'params'),
  getUserById
);

/**
 * POST /users - Create new user
 * Auth: required
 * Body: userName, fullName, email, password, isActive, roleIds, companyIds
 */
router.post(
  '/',
  auth,
  validateRequest(createUserBodySchema, 'body'),
  createUserHandler
);

/**
 * PUT /users/:user_id - Update user
 * Auth: required
 * Params: user_id
 * Body: userName, fullName, email, isActive, image
 */
router.put(
  '/:user_id',
  auth,
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(updateUserBodySchema, 'body'),
  updateUserHandler
);

/**
 * DELETE /users/:user_id - Soft delete user
 * Auth: required
 * Params: user_id
 */
router.delete(
  '/:user_id',
  auth,
  validateRequest(userIdParamSchema, 'params'),
  deleteUserHandler
);

/**
 * POST /users/:user_id/roles - Assign roles to user
 * Auth: required
 * Params: user_id
 * Body: roleIds: number[]
 */
router.post(
  '/:user_id/roles',
  auth,
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(assignRolesBodySchema, 'body'),
  assignRolesHandler
);

/**
 * POST /users/:user_id/companies - Assign companies to user
 * Auth: required
 * Params: user_id
 * Body: companyIds: number[]
 */
router.post(
  '/:user_id/companies',
  auth,
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(assignCompaniesBodySchema, 'body'),
  assignCompaniesHandler
);

/**
 * PATCH /users/:user_id/password - Change user password (admin)
 * Auth: required
 * Params: user_id
 * Body: newPassword: string
 */
router.patch(
  '/:user_id/password',
  auth,
  validateRequest(userIdParamSchema, 'params'),
  validateRequest(changePasswordBodySchema, 'body'),
  changePasswordHandler
);

export default router;
