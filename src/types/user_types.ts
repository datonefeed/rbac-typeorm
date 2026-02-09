/**
 * User Module Types
 * Định nghĩa types cho query params, filters, cursor pagination
 */

export interface UserListQueryParams {
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
  roleId?: number;
  companyId?: number;
}

export interface CursorPaginationResult<T> {
  data: T[];
  cursor: {
    afterCursor: string | null;
    beforeCursor: string | null;
  };
}

export interface UserListItem {
  id: number;
  userName: string;
  fullName: string | null;
  email: string;
  isActive: boolean;
  createdAt: Date;
  roles: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  companies: Array<{
    id: number;
    code: string;
    name: string;
  }>;
}

export interface UserDetail {
  id: number;
  userName: string;
  fullName: string | null;
  email: string;
  isActive: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  permissions: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  companies: Array<{
    id: number;
    code: string;
    name: string;
  }>;
}

export interface CreateUserInput {
  userName: string;
  fullName?: string;
  email: string;
  password: string;
  isActive?: boolean;
  roleIds?: number[];
  companyIds?: number[];
}

export interface UpdateUserInput {
  userName?: string;
  fullName?: string;
  email?: string;
  isActive?: boolean;
  image?: string;
}

export interface AssignRolesInput {
  roleIds: number[];
}

export interface AssignCompaniesInput {
  companyIds: number[];
}

export interface ChangePasswordInput {
  newPassword: string;
}
