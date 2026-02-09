import { DataSource } from 'typeorm';
import { Role } from '../../models/role';
import { Permission } from '../../models/permission';
import { RolePermission } from '../../models/role_permission';

interface FactoryManager {
  create<T = any>(entityName: string, overrides?: Partial<T>): Promise<T>;
  createMany<T = any>(entityName: string, count: number, overrides?: Partial<T>): Promise<T[]>;
}

export default class RbacSeed {
  async run(factory: FactoryManager, connection: DataSource): Promise<void> {
    console.log('Seeding RBAC (Roles, Permissions, Mappings)...\n');

    const roleRepo = connection.getRepository(Role);
    const permissionRepo = connection.getRepository(Permission);
    const rolePermissionRepo = connection.getRepository(RolePermission);

    // 1. Seed Roles
    console.log('Seeding roles...');
    const rolesData = [
      { roleName: 'DIRECTOR', description: 'Giám đốc công ty' },
      { roleName: 'IT_ADMIN', description: 'Quản trị viên IT' },
      { roleName: 'PROJECT_MANAGER', description: 'Quản lý dự án' },
      { roleName: 'DEVELOPER', description: 'Nhà phát triển' },
    ];

    const roles: Record<string, Role> = {};
    for (const roleData of rolesData) {
      let role = await roleRepo.findOne({ where: { roleName: roleData.roleName } });
      if (!role) {
        role = await roleRepo.save(roleData);
        console.log(`   Created role: ${roleData.roleName}`);
      } else {
        console.log(`   Role exists: ${roleData.roleName}`);
      }
      roles[roleData.roleName] = role;
    }

    // 2. Seed Permissions
    console.log('\nSeeding permissions...');
    const permissionsData = [
      { permissionName: 'PRJ_VIEW', description: 'Xem danh sách dự án' },
      { permissionName: 'PRJ_CREATE', description: 'Tạo dự án mới' },
      { permissionName: 'PRJ_EDIT', description: 'Chỉnh sửa dự án' },
      { permissionName: 'PRJ_DELETE', description: 'Xóa dự án' },
      { permissionName: 'USER_VIEW', description: 'Xem danh sách người dùng' },
      { permissionName: 'USER_CREATE', description: 'Tạo người dùng mới' },
      { permissionName: 'USER_EDIT', description: 'Chỉnh sửa người dùng' },
      { permissionName: 'USER_DELETE', description: 'Xóa người dùng' },
      { permissionName: 'ROLE_MANAGE', description: 'Quản lý vai trò' },
      { permissionName: 'PERMISSION_MANAGE', description: 'Quản lý quyền' },
    ];

    const permissions: Record<string, Permission> = {};
    for (const permData of permissionsData) {
      let permission = await permissionRepo.findOne({ 
        where: { permissionName: permData.permissionName } 
      });
      if (!permission) {
        permission = await permissionRepo.save(permData);
        console.log(`   Created permission: ${permData.permissionName}`);
      } else {
        console.log(`   Permission exists: ${permData.permissionName}`);
      }
      permissions[permData.permissionName] = permission;
    }

    // 3. Seed Role-Permission mappings
    console.log('\nSeeding role-permission mappings...');
    const rolePermissionsMap: Record<string, string[]> = {
      DIRECTOR: Object.keys(permissions),
      IT_ADMIN: ['USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'ROLE_MANAGE', 'PRJ_VIEW'],
      PROJECT_MANAGER: ['PRJ_VIEW', 'PRJ_CREATE', 'PRJ_EDIT', 'USER_VIEW'],
      DEVELOPER: ['PRJ_VIEW'],
    };

    for (const [roleName, permNames] of Object.entries(rolePermissionsMap)) {
      for (const permName of permNames) {
        const exists = await rolePermissionRepo.findOne({
          where: {
            roleId: roles[roleName].id,
            permissionId: permissions[permName].id,
          },
        });

        if (!exists) {
          await rolePermissionRepo.save({
            roleId: roles[roleName].id,
            permissionId: permissions[permName].id,
          });
        }
      }
      console.log(`   Mapped permissions for ${roleName}`);
    }
  }
}
