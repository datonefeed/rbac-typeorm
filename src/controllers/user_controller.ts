import { Request, Response } from 'express';
import {
  listUsers,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  assignRolesToUser,
  assignCompaniesToUser,
  changeUserPassword,
} from '../services/user_service';

import {
  UserListQueryParams,
  CreateUserInput,
  UpdateUserInput,
  AssignRolesInput,
  AssignCompaniesInput,
} from '../types/user_types';

/**
 * User Controller
 * Parse request + call service + return response
 */

/**
 * GET /users - List users với cursor pagination
 * Query params: limit, afterCursor, beforeCursor, order, search, isActive, roleId, companyId
 */
export async function getUserList(req: Request, res: Response): Promise<Response> {
  try {
    const params: UserListQueryParams = {
      limit: req.query.limit as any,
      afterCursor: req.query.afterCursor as string,
      beforeCursor: req.query.beforeCursor as string,
      order: req.query.order as 'ASC' | 'DESC',
      search: req.query.search as string,
      isActive: req.query.isActive as any,
      roleId: req.query.roleId as any,
      companyId: req.query.companyId as any,
    };

    const result = await listUsers(params);

    // Map to DTOs (already has roles + companies từ service)
    const users = result.data.map(item => ({
      id: item.id,
      userName: item.userName,
      fullName: item.fullName || null,
      email: item.email,
      isActive: item.isActive,
      createdAt: item.createdAt,
      roles: item.roles.map((r: any) => ({
        id: r.id,
        name: r.roleName,
        description: r.description || null,
      })),
      companies: item.companies.map((c: any) => ({
        id: c.id,
        code: c.companyCode,
        name: c.companyName,
      })),
    }));

    return res.status(200).json({
      success: true,
      data: {
        users,
        cursor: result.cursor,
      },
    });
  } catch (error) {
    console.error('Get user list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * GET /users/:user_id - Get user detail
 */
export async function getUserById(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.params.user_id as any;

    const result = await getUserDetail(userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Service already returns serialized data via UserSerializer
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * POST /users - Create new user
 * Body: userName, fullName, email, password, isActive, roleIds, companyIds
 */
export async function createUserHandler(req: Request, res: Response): Promise<Response> {
  try {
    const input: CreateUserInput = req.body;

    const user = await createUser(input);

    // Service already returns serialized data via UserSerializer
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Create user error:', error);

    if (error.message === 'userName already exists' || error.message === 'email already exists') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message?.includes('invalid') || error.message?.includes('inactive')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * PUT /users/:user_id - Update user
 * Body: userName, fullName, email, isActive, image
 */
export async function updateUserHandler(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.params.user_id as any;
    const input: UpdateUserInput = req.body;

    const user = await updateUser(userId, input);

    // Service already returns serialized data via UserSerializer
    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Update user error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'userName already exists' || error.message === 'email already exists') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * DELETE /users/:user_id - Soft delete user
 */
export async function deleteUserHandler(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.params.user_id as any;

    await deleteUser(userId);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * POST /users/:user_id/roles - Assign roles to user
 * Body: roleIds: number[]
 */
export async function assignRolesHandler(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.params.user_id as any;
    const input: AssignRolesInput = req.body;

    await assignRolesToUser(userId, input);

    return res.status(200).json({
      success: true,
      message: 'Roles assigned successfully',
    });
  } catch (error: any) {
    console.error('Assign roles error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message?.includes('invalid') || error.message?.includes('inactive')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * POST /users/:user_id/companies - Assign companies to user
 * Body: companyIds: number[]
 */
export async function assignCompaniesHandler(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.params.user_id as any;
    const input: AssignCompaniesInput = req.body;

    await assignCompaniesToUser(userId, input);

    return res.status(200).json({
      success: true,
      message: 'Companies assigned successfully',
    });
  } catch (error: any) {
    console.error('Assign companies error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message?.includes('invalid') || error.message?.includes('inactive')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * PATCH /users/:user_id/password - Change user password (admin)
 * Body: newPassword: string
 */
export async function changePasswordHandler(req: Request, res: Response): Promise<Response> {
  try {
    const userId = req.params.user_id as any;
    const { newPassword } = req.body;

    await changeUserPassword(userId, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Change password error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
