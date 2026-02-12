import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { createAccessToken, revokeToken } from '../utils/token_utils';
import { buildAbilities } from '../utils/ability_builder';
import { toLoginResponseDTO, toMeResponseDTO } from '../dto/auth_dto';
import { loadUserAuthData, findUserById } from '../services/auth_service';
import { extractBearerToken, getClientIp, getUserAgent } from '../utils/request_helpers';
import { setAuthCookie, clearAuthCookie, extractToken } from '../utils/cookie';
import { httpResponse } from '../utils/http_response';
import { createModuleLogger } from '../config/logger';
import { asyncHandler } from '../middleware/error_handler';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../errors';

const logger = createModuleLogger('auth');

//POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { identifier, password } = req.body;

  // Kiểm tra input có đầy đủ không
  if (!identifier || !password) {
    throw new BadRequestError('Identifier and password are required');
  }

  const authData = await loadUserAuthData(identifier);

  if (!authData) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const { user, roles, permissions, companies } = authData;
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Build mảng abilities 
  // Format: ['DIRECTOR', 'company:1', 'permission:PRJ_VIEW']
  const abilities = buildAbilities(roles, permissions, companies);
  
  const { token, expiresAt } = await createAccessToken(user.id, {
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });
  
  // Set token trong cookie
  setAuthCookie(res, token, expiresAt);
  
  logger.info({ userId: user.id }, 'User logged in successfully');
  
  return res.status(200).json(
    toLoginResponseDTO(user, roles, permissions, companies, abilities)
  );
});


//POST /api/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  // Lấy token từ header hoặc cookie
  const token = extractToken(req);

  if (!token) {
    throw new BadRequestError('No token provided');
  }

  // Revoke token 
  await revokeToken(token);
  
  // Clear cookie
  clearAuthCookie(res);

  logger.info({ userId: (req as any).user?.userId }, 'User logged out successfully');

  return httpResponse.ok(res, 'Đăng xuất thành công');
});

// GET /api/auth/me
export const me = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const userId = (req as any).user?.userId;
  const abilities = (req as any).user?.abilities || [];

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  // Load thông tin user mới nhất từ DB
  const user = await findUserById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Trả về user + abilities đã được parse từ token
  return res.status(200).json(toMeResponseDTO(user, abilities));
});