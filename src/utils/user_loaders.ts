import { In } from 'typeorm';
import { AppDataSource } from '../config/typeorm';
import { Role } from '../models/role';
import { Company } from '../models/company';
import { Permission } from '../models/permission';
import { UserRole } from '../models/user_role';
import { UserCompany } from '../models/user_company';
import { RolePermission } from '../models/role_permission';

// load user roles
export async function batchLoadUserRoles(userIds: number[]): Promise<Map<number, Role[]>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const userRoleRepo = AppDataSource.getRepository(UserRole);
  const roleRepo = AppDataSource.getRepository(Role);

  const userRoles = await userRoleRepo
    .createQueryBuilder('ur')
    .where('ur.userId IN (:...userIds)', { userIds })
    .andWhere('ur.isActive = :isActive', { isActive: true })
    .getMany();

  if (userRoles.length === 0) {
    return new Map();
  }

  const roleIds = [...new Set(userRoles.map(ur => ur.roleId))];
  const roles = await roleRepo.find({
    where: {
      id: In(roleIds),
      isActive: true,
    },
  });

  const roleMap = new Map<number, Role>();
  roles.forEach(role => roleMap.set(role.id, role));

  const result = new Map<number, Role[]>();
  userRoles.forEach(ur => {
    const role = roleMap.get(ur.roleId);
    if (role) {
      if (!result.has(ur.userId)) {
        result.set(ur.userId, []);
      }
      result.get(ur.userId)!.push(role);
    }
  });

  return result;
}

// load user companies
export async function batchLoadUserCompanies(userIds: number[]): Promise<Map<number, Company[]>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const userCompanyRepo = AppDataSource.getRepository(UserCompany);
  const companyRepo = AppDataSource.getRepository(Company);

  const userCompanies = await userCompanyRepo
    .createQueryBuilder('uc')
    .where('uc.userId IN (:...userIds)', { userIds })
    .andWhere('uc.isActive = :isActive', { isActive: true })
    .getMany();

  if (userCompanies.length === 0) {
    return new Map();
  }

  const companyIds = [...new Set(userCompanies.map(uc => uc.companyId))];
  const companies = await companyRepo
    .createQueryBuilder('c')
    .select(['c.id', 'c.name', 'c.code'])
    .where('c.id IN (:...companyIds)', { companyIds })
    .andWhere('c.isActive = :isActive', { isActive: true })
    .getMany();

  const companyMap = new Map<number, Company>();
  companies.forEach(company => companyMap.set(company.id, company));

  const result = new Map<number, Company[]>();
  userCompanies.forEach(uc => {
    const company = companyMap.get(uc.companyId);
    if (company) {
      if (!result.has(uc.userId)) {
        result.set(uc.userId, []);
      }
      result.get(uc.userId)!.push(company);
    }
  });

  return result;
}

// load permissions by roleIds
export async function batchLoadPermissionsByRoles(roleIds: number[]): Promise<Permission[]> {
  if (roleIds.length === 0) {
    return [];
  }

  const rolePermRepo = AppDataSource.getRepository(RolePermission);
  const permRepo = AppDataSource.getRepository(Permission);

  const rolePermissions = await rolePermRepo
    .createQueryBuilder('rp')
    .where('rp.roleId IN (:...roleIds)', { roleIds })
    .andWhere('rp.isActive = :isActive', { isActive: true })
    .getMany();

  if (rolePermissions.length === 0) {
    return [];
  }

  const permissionIds = [...new Set(rolePermissions.map(rp => rp.permissionId))];
  const permissions = await permRepo.find({
    where: {
      id: In(permissionIds),
      isActive: true,
    },
  });

  return permissions;
}

/**
 * Load full user data: roles + permissions + companies
 * Dùng cho detail endpoint (1 user)
 */
export async function loadUserFullData(userId: number) {
  const [rolesMap, companiesMap] = await Promise.all([
    batchLoadUserRoles([userId]),
    batchLoadUserCompanies([userId]),
  ]);

  const roles = rolesMap.get(userId) || [];
  const companies = companiesMap.get(userId) || [];
  
  // Load permissions từ roles
  const roleIds = roles.map(r => r.id);
  const permissions = await batchLoadPermissionsByRoles(roleIds);

  return {
    roles,
    permissions,
    companies,
  };
}
