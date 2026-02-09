import { DataSource } from 'typeorm';
import { User } from '../../models/user';
import { UserRole } from '../../models/user_role';
import { UserCompany } from '../../models/user_company';
import { Role } from '../../models/role';
import { Company } from '../../models/company';

interface FactoryManager {
  create<T = any>(entityName: string, overrides?: Partial<T>): Promise<T>;
  createMany<T = any>(entityName: string, count: number, overrides?: Partial<T>): Promise<T[]>;
}

export default class FakeBulkUsersSeed {
  async run(factory: FactoryManager, connection: DataSource): Promise<void> {
    console.log('\nSeeding fake bulk users...');

    const userRepo = connection.getRepository(User);
    const userRoleRepo = connection.getRepository(UserRole);
    const userCompanyRepo = connection.getRepository(UserCompany);
    const roleRepo = connection.getRepository(Role);
    const companyRepo = connection.getRepository(Company);

    // Check if we should skip
    const existingCount = await userRepo.count();
    if (existingCount > 20) {
      console.log('   Many users already exist, skipping bulk fake data');
      return;
    }

    const roles = await roleRepo.find();
    const companies = await companyRepo.find();

    if (roles.length === 0 || companies.length === 0) {
      console.log('   No roles or companies found, skipping bulk users');
      return;
    }

    const count = 10;
    const fakeUsers = await factory.createMany<User>('User', count);

    for (const userData of fakeUsers) {
      const exists = await userRepo.findOne({ where: { userName: userData.userName } });
      
      if (!exists) {
        const user = await userRepo.save(userData);
        
        // Assign random role
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        await userRoleRepo.save({
          userId: user.id,
          roleId: randomRole.id,
        });

        // Assign random company
        const randomCompany = companies[Math.floor(Math.random() * companies.length)];
        await userCompanyRepo.save({
          userId: user.id,
          companyId: randomCompany.id,
        });

        console.log(`   Created fake user: ${userData.userName}`);
      }
    }
  }
}
