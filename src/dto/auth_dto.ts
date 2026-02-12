import { User } from '../models/user';
import { Role } from '../models/role';
import { Permission } from '../models/permission';
import { Company } from '../models/company';

interface RoleDTO {
  id: number;
  name: string;
  description: string;
}

interface PermissionDTO {
  id: number;
  name: string;
  description: string;
}

interface CompanyDTO {
  id: number;
  code: string;
  name: string;
}

interface UserDTO {
  id: number;
  userName: string;
  fullName: string;
  email: string;
  isActive: boolean;
  image: string | null;
  roles: RoleDTO[];
  permissions: PermissionDTO[];
  companies: CompanyDTO[];
}

interface LoginResponseDTO {
  success: true;
  message: string;
  data: {
    user: UserDTO;
    abilities: string[];
  };
}

/**
 * Transform data to login response DTO
 */
export function toLoginResponseDTO(
  user: User,
  roles: Role[],
  permissions: Permission[],
  companies: Company[],
  abilities: string[]
): LoginResponseDTO {
  return {
    success: true,
    message: 'Đăng nhập thành công',
    data: {
      user: {
        id: user.id,
        userName: user.userName,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        image: user.image || null,
        roles: roles.map(r => ({
          id: r.id,
          name: r.roleName,
          description: r.description
        })),
        permissions: permissions.map(p => ({
          id: p.id,
          name: p.permissionName,
          description: p.description
        })),
        companies: companies.map(c => ({
          id: c.id,
          code: c.companyCode,
          name: c.companyName
        }))
      },
      abilities
    }
  };
}

/**
 * Transform user data for /me endpoint
 */
export function toMeResponseDTO(
  user: User,
  abilities: string[]
) {
  return {
    success: true,
    data: {
      id: user.id,
      userName: user.userName,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      image: user.image || null,
      abilities
    }
  };
}
