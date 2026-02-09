import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';


// Query params cho GET /users
export const getUserListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  afterCursor: z.string().optional(),
  beforeCursor: z.string().optional(),
  order: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  roleId: z.coerce.number().int().positive().optional(),
  companyId: z.coerce.number().int().positive().optional(),
});

// Params cho GET /users/:user_id
export const userIdParamSchema = z.object({
  user_id: z.coerce.number().int().positive(),
});

// Body cho POST /users
export const createUserBodySchema = z.object({
  userName: z.string().min(3).max(50),
  fullName: z.string().max(100).optional(),
  email: z.string().email(),
  password: z.string().min(6),
  isActive: z.boolean().optional().default(true),
  roleIds: z.array(z.number().int().positive()).optional(),
  companyIds: z.array(z.number().int().positive()).optional(),
});

// Body cho PUT /users/:user_id
export const updateUserBodySchema = z.object({
  userName: z.string().min(3).max(50).optional(),
  fullName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  image: z.string().optional(),
});

// Body cho POST /users/:user_id/roles
export const assignRolesBodySchema = z.object({
  roleIds: z.array(z.number().int().positive()).min(1),
});

// Body cho POST /users/:user_id/companies
export const assignCompaniesBodySchema = z.object({
  companyIds: z.array(z.number().int().positive()).min(1),
});

// Body cho PATCH /users/:user_id/password
export const changePasswordBodySchema = z.object({
  newPassword: z.string().min(6),
});

// Middleware validate request
type RequestPart = 'params' | 'query' | 'body';

export function validateRequest(schema: z.ZodSchema, part: RequestPart = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[part];
      const validated = await schema.parseAsync(data);
      req[part] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}
