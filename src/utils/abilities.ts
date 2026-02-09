import { ROLES } from '../constants/roles';
import { PERMISSIONS } from '../constants/permissions';

interface ParsedAbilities {
  roles: Set<string>;
  permissions: Set<string>;
  companies: Set<number>;
}

interface AccessOptions {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requiredCompanies?: number[];
  requireAll?: boolean;
}

/**
 * Parse abilities array into structured object
 * Abilities format: ['DIRECTOR', 'company:1', 'permission:PRJ_VIEW', ...]
 */
export function parseAbilities(abilities: string[]): ParsedAbilities {
  const parsed: ParsedAbilities = {
    roles: new Set(),
    permissions: new Set(),
    companies: new Set()
  };

  if (!Array.isArray(abilities)) {
    return parsed;
  }

  for (const ability of abilities) {
    if (!ability || typeof ability !== 'string') continue;

    // Check if it's a role
    if ((Object.values(ROLES) as string[]).includes(ability)) {
      parsed.roles.add(ability);
      continue;
    }

    // Check if it's a company (format: company:1)
    if (ability.startsWith('company:')) {
      const companyId = parseInt(ability.slice(8), 10);
      if (!isNaN(companyId) && companyId > 0) {
        parsed.companies.add(companyId);
      }
      continue;
    }

    // Check if it's a permission (format: permission:PRJ_VIEW)
    if (ability.startsWith('permission:')) {
      const permCode = ability.slice(11);
      if ((Object.values(PERMISSIONS) as string[]).includes(permCode)) {
        parsed.permissions.add(permCode);
      }
    }
  }

  return parsed;
}

/**
 * Check user có quyền không
 */
export function hasAccess(userAbilities: ParsedAbilities, options: AccessOptions = {}): boolean {
  const {
    requiredRoles = [],
    requiredPermissions = [],
    requiredCompanies = [],
    requireAll = false
  } = options;

  // Nếu là SUPERADMIN thì có full quyền
  if (userAbilities.roles.has(ROLES.SUPERADMIN)) {
    return true;
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const hasRole = requireAll
      ? requiredRoles.every(role => userAbilities.roles.has(role))
      : requiredRoles.some(role => userAbilities.roles.has(role));
    
    if (!hasRole) return false;
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasPerm = requireAll
      ? requiredPermissions.every(perm => userAbilities.permissions.has(perm))
      : requiredPermissions.some(perm => userAbilities.permissions.has(perm));
    
    if (!hasPerm) return false;
  }

  // Check companies
  if (requiredCompanies.length > 0) {
    const hasCompany = requireAll
      ? requiredCompanies.every(companyId => userAbilities.companies.has(companyId))
      : requiredCompanies.some(companyId => userAbilities.companies.has(companyId));
    
    if (!hasCompany) return false;
  }

  return true;
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(userAbilities: ParsedAbilities, ...roles: string[]): boolean {
  return hasAccess(userAbilities, { requiredRoles: roles });
}

/**
 * Check if user has any of the specified permissions
 */
export function hasPermission(userAbilities: ParsedAbilities, ...permissions: string[]): boolean {
  return hasAccess(userAbilities, { requiredPermissions: permissions });
}

/**
 * Check if user belongs to any of the specified companies
 */
export function belongsToCompany(userAbilities: ParsedAbilities, ...companyIds: number[]): boolean {
  return hasAccess(userAbilities, { requiredCompanies: companyIds });
}
