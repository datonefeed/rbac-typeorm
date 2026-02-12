import bcrypt from 'bcrypt';
import { In } from 'typeorm';
import { AppDataSource } from '../config/typeorm';
import { User } from '../models/user';
import { Role } from '../models/role';
import { Company } from '../models/company';
import { UserRole } from '../models/user_role';
import { UserCompany } from '../models/user_company';
import { revokeAllUserTokens } from '../utils/token_utils';
import { loadUserFullData } from '../utils/user_loaders';
import { applyFilters } from '../utils/query_builder';
import { UserSerializer } from '../utils/serializers/user_serializer';
import {
  createPaginationQuery,
  executeCursorPagination,
} from '../utils/pagination_helper';
import {
  UserListQueryParams,
  CursorPaginationResult,
  CreateUserInput,
  UpdateUserInput,
  AssignRolesInput,
  AssignCompaniesInput,
} from '../types/user_types';

// GET /users - List users with cursor pagination + filters
export async function listUsers(
  params: UserListQueryParams
): Promise<CursorPaginationResult<any>> {
  const {
    limit = 20,
    afterCursor,
    beforeCursor,
    order = 'DESC',
    search,
    isActive,
    roleId,
    companyId,
  } = params;

  const userRepo = AppDataSource.getRepository(User);

  // Create base query - only select IDs and createdAt
  let queryBuilder = createPaginationQuery(userRepo, 'user');

  // Apply filters
  queryBuilder = applyFilters(queryBuilder, {
    search: {
      fields: ['user.userName', 'user.fullName', 'user.email'],
      value: search,
    },
    boolean: [
      { field: 'user.isActive', value: isActive },
    ],
    relationExists: [
      {
        relationTable: UserRole,
        relationAlias: 'ur',
        mainTableAlias: 'user',
        conditions: [
          { field: 'ur.roleId', paramName: 'roleId', value: roleId },
          { field: 'ur.isActive', paramName: 'urActive', value: roleId ? true : undefined },
        ],
      },
      {
        relationTable: UserCompany,
        relationAlias: 'uc',
        mainTableAlias: 'user',
        conditions: [
          { field: 'uc.companyId', paramName: 'companyId', value: companyId },
          { field: 'uc.isActive', paramName: 'ucActive', value: companyId ? true : undefined },
        ],
      },
    ],
  });

  // Execute pagination with relation hydration
  return await executeCursorPagination(
    queryBuilder,
    userRepo,
    { limit, afterCursor, beforeCursor, order },
    {
      relations: {
        userRoles: {
          role: true,
        },
        userCompanies: {
          company: true,
        },
      },
      select: {
        id: true,
        userName: true,
        fullName: true,
        email: true,
        isActive: true,
        image: true,
        createdAt: true,
        userRoles: {
          id: true,
          isActive: true,
          role: {
            id: true,
            roleName: true,
            description: true,
          },
        },
        userCompanies: {
          id: true,
          isActive: true,
          company: {
            id: true,
            companyName: true,
            companyCode: true,
          },
        },
      },
    },
    // Transform using UserSerializer
    UserSerializer.toListResponse
  );
}


 //GET /users/:user_id - Get user detail
export async function getUserDetail(userId: number) {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  const { roles, permissions, companies } = await loadUserFullData(userId);

  return UserSerializer.toDetailResponse({
    user,
    roles,
    permissions,
    companies,
  });
}

 //POST /users - Create new user

export async function createUser(input: CreateUserInput) {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const companyRepo = AppDataSource.getRepository(Company);
  const userRoleRepo = AppDataSource.getRepository(UserRole);
  const userCompanyRepo = AppDataSource.getRepository(UserCompany);

  // Parallel validation: uniqueness + hash password + validate relations
  const [existingUserName, existingEmail, hashedPassword, validatedRoles, validatedCompanies] = await Promise.all([
    // Check userName uniqueness
    userRepo.findOne({ where: { userName: input.userName } }),
    
    // Check email uniqueness
    userRepo.findOne({ where: { email: input.email } }),
    
    // Hash password in parallel
    bcrypt.hash(input.password, 10),
    
    // Validate roles if provided
    input.roleIds && input.roleIds.length > 0
      ? roleRepo.findBy({ id: In(input.roleIds), isActive: true })
      : Promise.resolve([]),
    
    // Validate companies if provided
    input.companyIds && input.companyIds.length > 0
      ? companyRepo.findBy({ id: In(input.companyIds), isActive: true })
      : Promise.resolve([]),
  ]);

  // Validation checks
  if (existingUserName) {
    throw new Error('userName already exists');
  }
  if (existingEmail) {
    throw new Error('email already exists');
  }
  if (input.roleIds && input.roleIds.length > 0 && validatedRoles.length !== input.roleIds.length) {
    throw new Error('Some roleIds are invalid or inactive');
  }
  if (input.companyIds && input.companyIds.length > 0 && validatedCompanies.length !== input.companyIds.length) {
    throw new Error('Some companyIds are invalid or inactive');
  }

  // Create user
  const user = userRepo.create({
    userName: input.userName,
    fullName: input.fullName || undefined,
    email: input.email,
    password: hashedPassword,
    isActive: input.isActive !== undefined ? input.isActive : true,
  });

  await userRepo.save(user);

  // Parallel insert userRoles and userCompanies
  const insertPromises: Promise<any>[] = [];

  if (input.roleIds && input.roleIds.length > 0) {
    const userRoles = userRoleRepo.create(
      input.roleIds.map(roleId => ({
        userId: user.id,
        roleId,
        isActive: true,
      }))
    );
    insertPromises.push(userRoleRepo.save(userRoles));
  }

  if (input.companyIds && input.companyIds.length > 0) {
    const userCompanies = userCompanyRepo.create(
      input.companyIds.map(companyId => ({
        userId: user.id,
        companyId,
        isActive: true,
      }))
    );
    insertPromises.push(userCompanyRepo.save(userCompanies));
  }

  // Execute parallel inserts if any
  if (insertPromises.length > 0) {
    await Promise.all(insertPromises);
  }

  return UserSerializer.toBasicResponse(user);
}

// PATCH /users/:user_id - Update user info
export async function updateUser(userId: number, input: UpdateUserInput) {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  // Check unique userName (nếu thay đổi)
  if (input.userName && input.userName !== user.userName) {
    const existingUserName = await userRepo.findOne({
      where: { userName: input.userName },
    });
    if (existingUserName) {
      throw new Error('userName already exists');
    }
  }

  // Check unique email (nếu thay đổi)
  if (input.email && input.email !== user.email) {
    const existingEmail = await userRepo.findOne({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new Error('email already exists');
    }
  }

  // Track isActive change
  const wasActive = user.isActive;

  // Update fields
  if (input.userName !== undefined) user.userName = input.userName;
  if (input.fullName !== undefined) user.fullName = input.fullName;
  if (input.email !== undefined) user.email = input.email;
  if (input.isActive !== undefined) user.isActive = input.isActive;
  if (input.image !== undefined) user.image = input.image;

  await userRepo.save(user);

  // Revoke tokens nếu isActive chuyển false
  if (wasActive && input.isActive === false) {
    await revokeAllUserTokens(userId);
  }

  return UserSerializer.toBasicResponse(user);
}


// DELETE /users/:user_id - Soft delete user

export async function deleteUser(userId: number) {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  // Soft delete: set isActive = false
  user.isActive = false;
  await userRepo.save(user);

  // Revoke tokens
  await revokeAllUserTokens(userId);

  return UserSerializer.toBasicResponse(user);
}

// POST /users/:user_id/roles - Assign roles

export async function assignRolesToUser(userId: number, input: AssignRolesInput) {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const userRoleRepo = AppDataSource.getRepository(UserRole);

  // Check user exists
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  // Check roles exist and active
  const roles = await roleRepo.findBy({ id: input.roleIds as any, isActive: true });
  if (roles.length !== input.roleIds.length) {
    throw new Error('Some roleIds are invalid or inactive');
  }

  // Transaction: replace user_roles
  await AppDataSource.transaction(async manager => {
    // Deactivate existing user_roles
    await manager
      .createQueryBuilder()
      .update(UserRole)
      .set({ isActive: false })
      .where('userId = :userId', { userId })
      .execute();

    // Insert new user_roles
    const newUserRoles = input.roleIds.map(roleId =>
      manager.create(UserRole, {
        userId,
        roleId,
        isActive: true,
      })
    );
    await manager.save(newUserRoles);
  });

  // Revoke tokens (roles changed)
  await revokeAllUserTokens(userId);
}

 // POST /users/:user_id/companies - Assign companies

export async function assignCompaniesToUser(userId: number, input: AssignCompaniesInput) {
  const userRepo = AppDataSource.getRepository(User);
  const companyRepo = AppDataSource.getRepository(Company);
  const userCompanyRepo = AppDataSource.getRepository(UserCompany);

  // Check user exists
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  // Check companies exist and active
  const companies = await companyRepo.findBy({ id: input.companyIds as any, isActive: true });
  if (companies.length !== input.companyIds.length) {
    throw new Error('Some companyIds are invalid or inactive');
  }

  // Transaction: replace user_companies
  await AppDataSource.transaction(async manager => {
    // Deactivate existing user_companies
    await manager
      .createQueryBuilder()
      .update(UserCompany)
      .set({ isActive: false })
      .where('userId = :userId', { userId })
      .execute();

    // Insert new user_companies
    const newUserCompanies = input.companyIds.map(companyId =>
      manager.create(UserCompany, {
        userId,
        companyId,
        isActive: true,
      })
    );
    await manager.save(newUserCompanies);
  });

  // Revoke tokens (companies changed)
  await revokeAllUserTokens(userId);
}

 // PATCH /users/:user_id/password - Change user password (admin)

export async function changeUserPassword(userId: number, newPassword: string) {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await userRepo.save(user);

  // Revoke tokens (password changed)
  await revokeAllUserTokens(userId);

  return UserSerializer.toBasicResponse(user);
}
