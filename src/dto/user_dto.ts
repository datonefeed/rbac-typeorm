import { User } from '../models/user';
import { Role } from '../models/role';
import { Permission } from '../models/permission';
import { Company } from '../models/company';
import { UserListItem, UserDetail } from '../types/user_types';

/**
 * User DTOs - Data Transfer Objects
 * Map từ entities sang response objects (không trả password)
 */

/**
 * Map User entity sang list item DTO
 * Dùng cho GET /users (list)
 */
export function toUserListItemDTO(
  user: User,
  roles: Role[],
  companies: Company[]
): UserListItem {
  return {
    id: user.id,
    userName: user.userName,
    fullName: user.fullName || null,
    email: user.email,
    isActive: user.isActive,
    createdAt: user.createdAt,
    roles: roles.map(role => ({
      id: role.id,
      name: role.roleName,
      description: role.description || null,
    })),
    companies: companies.map(company => ({
      id: company.id,
      code: company.companyCode,
      name: company.companyName,
    })),
  };
}

/**
 * Batch map nhiều users sang list DTOs
 * Dùng kết hợp với batch loaders
 */
export function toUserListDTOs(
  users: User[],
  rolesMap: Map<number, Role[]>,
  companiesMap: Map<number, Company[]>
): UserListItem[] {
  return users.map(user => {
    const roles = rolesMap.get(user.id) || [];
    const companies = companiesMap.get(user.id) || [];
    return toUserListItemDTO(user, roles, companies);
  });
}

/**
 * Map User entity sang detail DTO
 * Dùng cho GET /users/:user_id, POST /users, PUT /users/:user_id
 */
export function toUserDetailDTO(
  user: User,
  roles: Role[],
  permissions: Permission[],
  companies: Company[]
): UserDetail {
  return {
    id: user.id,
    userName: user.userName,
    fullName: user.fullName || null,
    email: user.email,
    isActive: user.isActive,
    image: user.image || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: roles.map(role => ({
      id: role.id,
      name: role.roleName,
      description: role.description || null,
    })),
    permissions: permissions.map(perm => ({
      id: perm.id,
      name: perm.permissionName,
      description: perm.description || null,
    })),
    companies: companies.map(company => ({
      id: company.id,
      code: company.companyCode,
      name: company.companyName,
    })),
  };
}

/**
 * Simple user DTO (không có relations)
 * Dùng cho các response đơn giản
 */
export function toSimpleUserDTO(user: User) {
  return {
    id: user.id,
    userName: user.userName,
    fullName: user.fullName || null,
    email: user.email,
    isActive: user.isActive,
    image: user.image || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
