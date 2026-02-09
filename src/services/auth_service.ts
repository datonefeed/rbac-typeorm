import { AppDataSource } from '../config/typeorm';
import { User } from '../models/user';
import { Role } from '../models/role';
import { Permission } from '../models/permission';
import { Company } from '../models/company';

interface UserAuthData {
  user: User;
  roles: Role[];
  permissions: Permission[];
  companies: Company[];
}

/**
 * Load user with all active relationships for authentication
 * Uses TypeORM QueryBuilder to efficiently fetch only active records
 */
export async function loadUserAuthData(identifier: string): Promise<UserAuthData | null> {
  const userRepo = AppDataSource.getRepository(User);

  // Step 1: Find active user by userName or email
  const user = await userRepo
    .createQueryBuilder('user')
    .where('user.isActive = :isActive', { isActive: true })
    .andWhere('(user.userName = :identifier OR user.email = :identifier)', { identifier })
    .getOne();

  if (!user) {
    return null;
  }

  // Step 2: Load active roles with QueryBuilder
  // Join user_roles (active) -> roles (active) -> role_permissions (active) -> permissions (active)
  const rolesWithPermissions = await AppDataSource
    .createQueryBuilder()
    .select([
      'role.id',
      'role.roleName',
      'role.description',
      'permission.id',
      'permission.permissionName',
      'permission.description'
    ])
    .from('user_roles', 'ur')
    .innerJoin('roles', 'role', 'role.id = ur.roleId')
    .leftJoin('role_permissions', 'rp', 'rp.roleId = role.id AND rp.isActive = true')
    .leftJoin('permissions', 'permission', 'permission.id = rp.permissionId AND permission.isActive = true')
    .where('ur.userId = :userId', { userId: user.id })
    .andWhere('ur.isActive = true')
    .andWhere('role.isActive = true')
    .getRawMany();

  // Step 3: Load active companies with QueryBuilder
  const companiesData = await AppDataSource
    .createQueryBuilder()
    .select([
      'company.id',
      'company.companyCode',
      'company.companyName'
    ])
    .from('user_companies', 'uc')
    .innerJoin('companies', 'company', 'company.id = uc.companyId')
    .where('uc.userId = :userId', { userId: user.id })
    .andWhere('uc.isActive = true')
    .andWhere('company.isActive = true')
    .getRawMany();

  // Step 4: Transform raw results to entities
  const rolesMap = new Map<number, Role>();
  const permissionsMap = new Map<number, Permission>();

  rolesWithPermissions.forEach(row => {
    // Add role
    if (row.role_id && !rolesMap.has(row.role_id)) {
      const role = new Role();
      role.id = row.role_id;
      role.roleName = row.role_roleName;
      role.description = row.role_description;
      rolesMap.set(role.id, role);
    }

    // Add permission
    if (row.permission_id && !permissionsMap.has(row.permission_id)) {
      const permission = new Permission();
      permission.id = row.permission_id;
      permission.permissionName = row.permission_permissionName;
      permission.description = row.permission_description;
      permissionsMap.set(permission.id, permission);
    }
  });

  const companies = companiesData.map(row => {
    const company = new Company();
    company.id = row.company_id;
    company.companyCode = row.company_companyCode;
    company.companyName = row.company_companyName;
    return company;
  });

  return {
    user,
    roles: Array.from(rolesMap.values()),
    permissions: Array.from(permissionsMap.values()),
    companies
  };
}

/**
 * Find user by ID for /me endpoint
 */
export async function findUserById(userId: number): Promise<User | null> {
  const userRepo = AppDataSource.getRepository(User);
  return await userRepo.findOne({
    where: { id: userId, isActive: true }
  });
}
