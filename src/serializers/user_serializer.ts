import { User } from '../models/user';
import { Role } from '../models/role';
import { Company } from '../models/company';
import { Permission } from '../models/permission';

/**
 * User Serializer
 * Centralize response shaping logic for User entity
 */
export class UserSerializer {
  /**
   * Serialize user for list response
   * Used in GET /users (list with pagination)
   */
  static toListResponse(user: User & { userRoles?: any[]; userCompanies?: any[] }) {
    return {
      id: user.id,
      userName: user.userName,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      image: user.image,
      createdAt: user.createdAt,
      roles: UserSerializer.serializeRoles(user.userRoles),
      companies: UserSerializer.serializeCompanies(user.userCompanies),
    };
  }

  /**
   * Serialize user for detail response
   * Used in GET /users/:id
   */
  static toDetailResponse(data: {
    user: User;
    roles: Role[];
    permissions: Permission[];
    companies: Company[];
  }) {
    return {
      id: data.user.id,
      userName: data.user.userName,
      fullName: data.user.fullName,
      email: data.user.email,
      isActive: data.user.isActive,
      image: data.user.image,
      createdAt: data.user.createdAt,
      updatedAt: data.user.updatedAt,
      roles: data.roles.map(role => ({
        id: role.id,
        roleName: role.roleName,
        description: role.description,
      })),
      permissions: data.permissions.map(permission => ({
        id: permission.id,
        permissionName: permission.permissionName,
        description: permission.description,
      })),
      companies: data.companies.map(company => ({
        id: company.id,
        companyName: company.companyName,
        companyCode: company.companyCode,
      })),
    };
  }

  /**
   * Serialize user for creation/update response
   * Used in POST /users, PATCH /users/:id
   * Excludes sensitive data and relations
   */
  static toBasicResponse(user: User) {
    return {
      id: user.id,
      userName: user.userName,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Serialize user for authentication response
   * Used in login/register
   * Includes minimal user info without sensitive data
   */
  static toAuthResponse(user: User) {
    return {
      id: user.id,
      userName: user.userName,
      fullName: user.fullName,
      email: user.email,
      image: user.image,
    };
  }

  /**
   * Helper: Serialize roles from userRoles junction table
   * Filters active relations and extracts role data
   */
  private static serializeRoles(userRoles?: any[]): any[] {
    if (!userRoles) return [];
    
    return userRoles
      .filter(ur => ur.isActive && ur.role)
      .map(ur => ({
        id: ur.role.id,
        roleName: ur.role.roleName,
        description: ur.role.description,
      }));
  }

  /**
   * Helper: Serialize companies from userCompanies junction table
   * Filters active relations and extracts company data
   */
  private static serializeCompanies(userCompanies?: any[]): any[] {
    if (!userCompanies) return [];
    
    return userCompanies
      .filter(uc => uc.isActive && uc.company)
      .map(uc => ({
        id: uc.company.id,
        companyName: uc.company.companyName,
        companyCode: uc.company.companyCode,
      }));
  }
}
