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
 * Optimized: Single query with relations instead of multiple raw queries
 */
export async function loadUserAuthData(identifier: string): Promise<UserAuthData | null> {
  const userRepo = AppDataSource.getRepository(User);

  // Load user with all relations in ONE query
  const user = await userRepo.findOne({
    where: [
      { userName: identifier, isActive: true },
      { email: identifier, isActive: true }
    ],
    select: {
      id: true,
      userName: true,
      fullName: true,
      email: true,
      password: true,
      isActive: true,
      image: true,
      userRoles: {
        id: true,
        isActive: true,
        role: {
          id: true,
          roleName: true,
          description: true,
          rolePermissions: {
            id: true,
            isActive: true,
            permission: {
              id: true,
              permissionName: true,
              description: true
            }
          }
        }
      },
      userCompanies: {
        id: true,
        isActive: true,
        company: {
          id: true,
          companyCode: true,
          companyName: true
        }
      }
    },
    relations: {
      userRoles: {
        role: {
          rolePermissions: {
            permission: true
          }
        }
      },
      userCompanies: {
        company: true
      }
    }
  });

  if (!user) {
    return null;
  }

  // Extract active roles
  const rolesMap = new Map<number, Role>();
  const permissionsMap = new Map<number, Permission>();

  user.userRoles
    ?.filter(ur => ur.isActive && ur.role?.isActive)
    .forEach(ur => {
      const role = ur.role!;
      
      // Add role
      if (!rolesMap.has(role.id)) {
        const roleEntity = new Role();
        roleEntity.id = role.id;
        roleEntity.roleName = role.roleName;
        roleEntity.description = role.description;
        rolesMap.set(role.id, roleEntity);
      }

      // Add permissions from role
      role.rolePermissions
        ?.filter(rp => rp.isActive && rp.permission?.isActive)
        .forEach(rp => {
          const permission = rp.permission!;
          if (!permissionsMap.has(permission.id)) {
            const permEntity = new Permission();
            permEntity.id = permission.id;
            permEntity.permissionName = permission.permissionName;
            permEntity.description = permission.description;
            permissionsMap.set(permission.id, permEntity);
          }
        });
    });

  // Extract active companies
  const companies = user.userCompanies
    ?.filter(uc => uc.isActive && uc.company?.isActive)
    .map(uc => {
      const company = new Company();
      company.id = uc.company!.id;
      company.companyCode = uc.company!.companyCode;
      company.companyName = uc.company!.companyName;
      return company;
    }) || [];

  return {
    user,
    roles: Array.from(rolesMap.values()),
    permissions: Array.from(permissionsMap.values()),
    companies
  };
}

/**
 * Find user by ID for /me endpoint (optimized with selected fields)
 */
export async function findUserById(userId: number): Promise<User | null> {
  const userRepo = AppDataSource.getRepository(User);
  return await userRepo.findOne({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      userName: true,
      fullName: true,
      email: true,
      isActive: true,
      image: true
    }
  });
}
