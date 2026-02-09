import { Role } from '../models/role';
import { Permission } from '../models/permission';
import { Company } from '../models/company';

interface AbilityItem {
  type: 'role' | 'company' | 'permission';
  value: string;
}

/**
 * Build abilities array from roles, permissions, and companies
 * Format: ['DIRECTOR', 'company:1', 'permission:PRJ_VIEW']
 * - Unique values using Set
 * - Sorted for stable output (easier debugging/testing)
 */
export function buildAbilities(
  roles: Role[],
  permissions: Permission[],
  companies: Company[]
): string[] {
  const abilities = new Set<string>();

  // Add roles: ['DIRECTOR', 'PROD_MANAGER', ...]
  roles.forEach(role => {
    if (role.roleName) {
      abilities.add(role.roleName);
    }
  });

  // Add companies: ['company:1', 'company:2', ...]
  companies.forEach(company => {
    if (company.id) {
      abilities.add(`company:${company.id}`);
    }
  });

  // Add permissions: ['permission:PRJ_VIEW', 'permission:PRJ_CREATE', ...]
  permissions.forEach(permission => {
    if (permission.permissionName) {
      abilities.add(`permission:${permission.permissionName}`);
    }
  });

  // Convert to sorted array for stable output
  return Array.from(abilities).sort();
}

/**
 * Build abilities details for response (structured format)
 */
export function buildAbilitiesDetails(
  roles: Role[],
  permissions: Permission[],
  companies: Company[]
) {
  return {
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
  };
}
