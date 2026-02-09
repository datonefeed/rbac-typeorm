import bcrypt from 'bcrypt';
import { Brackets, In } from 'typeorm';
import {
  buildPaginator,
  PagingResult,
} from 'typeorm-cursor-pagination';
import { AppDataSource } from '../config/typeorm';
import { User } from '../models/user';
import { Role } from '../models/role';
import { Company } from '../models/company';
import { UserRole } from '../models/user_role';
import { UserCompany } from '../models/user_company';
import { revokeAllUserTokens } from '../utils/token_utils';
import { loadUserFullData } from '../utils/user_loaders';
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

  // chỉ query để lấy user IDs
  let queryBuilder = userRepo
    .createQueryBuilder('user')
    .select(['user.id', 'user.createdAt']);

  // Filter: search (ILIKE userName/fullName/email)
  if (search) {
    queryBuilder = queryBuilder.andWhere(
      new Brackets(qb => {
        qb.where('user.userName ILIKE :search', { search: `%${search}%` })
          .orWhere('user.fullName ILIKE :search', { search: `%${search}%` })
          .orWhere('user.email ILIKE :search', { search: `%${search}%` });
      })
    );
  }

  if (isActive !== undefined) {
    queryBuilder = queryBuilder.andWhere('user.isActive = :isActive', { isActive });
  }

  // Filter: roleId (EXISTS subquery - không join, chỉ filter)
  if (roleId) {
    queryBuilder = queryBuilder.andWhere(qb => {
      const subQuery = qb
        .subQuery()
        .select('1')
        .from(UserRole, 'ur')
        .where('ur.userId = user.id')
        .andWhere('ur.roleId = :roleId', { roleId })
        .andWhere('ur.isActive = true')
        .getQuery();
      return `EXISTS ${subQuery}`;
    });
  }

  // Filter: companyId (EXISTS subquery)
  if (companyId) {
    queryBuilder = queryBuilder.andWhere(qb => {
      const subQuery = qb
        .subQuery()
        .select('1')
        .from(UserCompany, 'uc')
        .where('uc.userId = user.id')
        .andWhere('uc.companyId = :companyId', { companyId })
        .andWhere('uc.isActive = true')
        .getQuery();
      return `EXISTS ${subQuery}`;
    });
  }

  // Cursor pagination config
  const paginator = buildPaginator({
    entity: User,
    alias: 'user',
    paginationKeys: ['id'],
    query: {
      limit,
      order: order,
      afterCursor,
      beforeCursor,
    },
  });

  // Execute pagination - lấy user IDs
  const paginationResult: PagingResult<User> = await paginator.paginate(queryBuilder);

  if (paginationResult.data.length === 0) {
    return {
      data: [],
      cursor: {
        afterCursor: null,
        beforeCursor: null,
      },
    };
  }

  // Step 2: Extract userIds (giữ đúng thứ tự của pagination)
  const userIds = paginationResult.data.map(u => u.id);

  // Step 3: Hydrate relations với find() + relationLoadStrategy: 'query'
  const usersWithRelations = await userRepo.find({
    where: { id: In(userIds) },
    relationLoadStrategy: 'query',
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
  });

  // Step 4: Transform userRoles/userCompanies thành roles/companies và filter active
  const transformedUsers = usersWithRelations.map(user => ({
    id: user.id,
    userName: user.userName,
    fullName: user.fullName,
    email: user.email,
    isActive: user.isActive,
    image: user.image,
    createdAt: user.createdAt,
    roles: user.userRoles
      ?.filter(ur => ur.isActive && ur.role)
      .map(ur => ur.role) || [],
    companies: user.userCompanies
      ?.filter(uc => uc.isActive && uc.company)
      .map(uc => uc.company) || [],
  }));

  // Step 5: Reorder theo userIds (vì find(In(...)) không đảm bảo thứ tự)
  const userMap = new Map(transformedUsers.map(u => [u.id, u]));
  const usersOrdered = userIds.map(id => userMap.get(id)).filter(Boolean);

  return {
    data: usersOrdered,
    cursor: {
      afterCursor: paginationResult.cursor.afterCursor,
      beforeCursor: paginationResult.cursor.beforeCursor,
    },
  };
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

  // Load relations: roles + permissions + companies
  const { roles, permissions, companies } = await loadUserFullData(userId);

  return {
    user,
    roles,
    permissions,
    companies,
  };
}

 //POST /users - Create new user

export async function createUser(input: CreateUserInput) {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const companyRepo = AppDataSource.getRepository(Company);

  // Check unique userName
  const existingUserName = await userRepo.findOne({
    where: { userName: input.userName },
  });
  if (existingUserName) {
    throw new Error('userName already exists');
  }

  // Check unique email
  const existingEmail = await userRepo.findOne({
    where: { email: input.email },
  });
  if (existingEmail) {
    throw new Error('email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Transaction: create user + assign roles/companies
  return await AppDataSource.transaction(async manager => {
    // Create user
    const user = manager.create(User, {
      userName: input.userName,
      fullName: input.fullName || undefined,
      email: input.email,
      password: hashedPassword,
      isActive: input.isActive !== undefined ? input.isActive : true,
    });

    await manager.save(user);

    // Assign roles (if provided)
    if (input.roleIds && input.roleIds.length > 0) {
      const roles = await manager.findBy(Role, { id: input.roleIds as any, isActive: true });
      if (roles.length !== input.roleIds.length) {
        throw new Error('Some roleIds are invalid or inactive');
      }

      const userRoles = input.roleIds.map(roleId =>
        manager.create(UserRole, {
          userId: user.id,
          roleId,
          isActive: true,
        })
      );
      await manager.save(userRoles);
    }

    // Assign companies (if provided)
    if (input.companyIds && input.companyIds.length > 0) {
      const companies = await manager.findBy(Company, { id: input.companyIds as any, isActive: true });
      if (companies.length !== input.companyIds.length) {
        throw new Error('Some companyIds are invalid or inactive');
      }

      const userCompanies = input.companyIds.map(companyId =>
        manager.create(UserCompany, {
          userId: user.id,
          companyId,
          isActive: true,
        })
      );
      await manager.save(userCompanies);
    }

    return user;
  });
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

  return user;
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

  return user;
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

  return user;
}
