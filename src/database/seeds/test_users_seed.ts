import bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../models/user';
import { UserRole } from '../../models/user_role';
import { Role } from '../../models/role';

interface FactoryManager {
  create<T = any>(entityName: string, overrides?: Partial<T>): Promise<T>;
  createMany<T = any>(entityName: string, count: number, overrides?: Partial<T>): Promise<T[]>;
}

export default class TestUsersSeed {
  async run(factory: FactoryManager, connection: DataSource): Promise<void> {
    console.log('\nSeeding test users...');

    const userRepo = connection.getRepository(User);
    const userRoleRepo = connection.getRepository(UserRole);
    const roleRepo = connection.getRepository(Role);

    const hashedPassword = await bcrypt.hash('test123', 10);

    // Get developer role
    const devRole = await roleRepo.findOne({ where: { roleName: 'DEVELOPER' } });
    if (!devRole) {
      console.log('   Developer role not found, skipping test users');
      return;
    }

    const testUsers = [
      { userName: 'test1', fullName: 'Test User 1', email: 'test1@test.com' },
      { userName: 'test2', fullName: 'Test User 2', email: 'test2@test.com' },
      { userName: 'test3', fullName: 'Test User 3', email: 'test3@test.com' },
    ];

    for (const userData of testUsers) {
      let user = await userRepo.findOne({ where: { userName: userData.userName } });
      if (!user) {
        user = await userRepo.save({
          ...userData,
          password: hashedPassword,
        });
        
        await userRoleRepo.save({
          userId: user.id,
          roleId: devRole.id,
        });
        
        console.log(`   Created test user: ${userData.userName}`);
      } else {
        console.log(`   Test user exists: ${userData.userName}`);
      }
    }
  }
}
