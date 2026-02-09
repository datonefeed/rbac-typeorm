import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { createAccessToken, revokeToken } from '../utils/token_utils';
import { buildAbilities } from '../utils/ability_builder';
import { toLoginResponseDTO, toMeResponseDTO } from '../dto/auth_dto';
import { loadUserAuthData, findUserById } from '../services/auth_service';
import { extractBearerToken, getClientIp, getUserAgent } from '../utils/request_helpers';

//POST /api/auth/login
export async function login(req: Request, res: Response): Promise<Response> {
  try {
    const { identifier, password } = req.body;

    // Kiểm tra input có đầy đủ không
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and password are required',
      });
    }

    const authData = await loadUserAuthData(identifier);

    if (!authData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const { user, roles, permissions, companies } = authData;
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Build mảng abilities 
    // Format: ['DIRECTOR', 'company:1', 'permission:PRJ_VIEW']
    const abilities = buildAbilities(roles, permissions, companies);
    
    const { token, expiresAt } = await createAccessToken(user.id, {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });
    
    return res.status(200).json(
      toLoginResponseDTO(user, roles, permissions, companies, token, expiresAt, abilities)
    );
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}


//POST /api/auth/logout

export async function logout(req: Request, res: Response): Promise<Response> {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided',
      });
    }

    // Revoke token 
    await revokeToken(token);

    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}


  // GET /api/auth/me

export async function me(req: Request, res: Response): Promise<Response> {
  try {
    const userId = (req as any).user?.userId;
    const abilities = (req as any).user?.abilities || [];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Load thông tin user mới nhất từ DB
    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Trả về user + abilities đã được parse từ token
    return res.status(200).json(toMeResponseDTO(user, abilities));
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
