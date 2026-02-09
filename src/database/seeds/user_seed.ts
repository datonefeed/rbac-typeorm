import bcrypt from 'bcrypt';
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

export default class UserSeed {
  async run(factory: FactoryManager, connection: DataSource): Promise<void> {
    console.log('\nSeeding users...');

    const userRepo = connection.getRepository(User);
    const userRoleRepo = connection.getRepository(UserRole);
    const userCompanyRepo = connection.getRepository(UserCompany);
    const roleRepo = connection.getRepository(Role);
    const companyRepo = connection.getRepository(Company);

    // Get all roles
    const allRoles = await roleRepo.find();
    const roles: Record<string, Role> = {};
    allRoles.forEach(r => { roles[r.roleName] = r; });

    // Get all companies
    const allCompanies = await companyRepo.find();
    const companies: Record<string, Company> = {};
    allCompanies.forEach(c => { companies[c.companyCode] = c; });

    const hashedPassword = await bcrypt.hash('123456', 10);

    const usersData = [
      {
        userName: 'director',
        fullName: 'Giám đốc',
        email: 'director@company.com',
        password: hashedPassword,
        role: 'DIRECTOR',
        company: 'COMPANY_A',
      },
      {
        userName: 'admin',
        fullName: 'Quản trị viên',
        email: 'admin@company.com',
        password: hashedPassword,
        role: 'IT_ADMIN',
        company: 'COMPANY_A',
      },
      {
        userName: 'pm',
        fullName: 'Quản lý dự án',
        email: 'pm@company.com',
        password: hashedPassword,
        role: 'PROJECT_MANAGER',
        company: 'COMPANY_B',
      },
      {
        userName: 'dev',
        fullName: 'Developer',
        email: 'dev@company.com',
        password: hashedPassword,
        role: 'DEVELOPER',
        company: 'COMPANY_B',
      },
    ];

    for (const userData of usersData) {
      let user = await userRepo.findOne({ where: { userName: userData.userName } });
      if (!user) {
        user = await userRepo.save({
          userName: userData.userName,
          fullName: userData.fullName,
          email: userData.email,
          password: userData.password,
        });
        console.log(`   Created user: ${userData.userName}`);

        // Assign role
        await userRoleRepo.save({
          userId: user.id,
          roleId: roles[userData.role].id,
        });

        // Assign company
        await userCompanyRepo.save({
          userId: user.id,
          companyId: companies[userData.company].id,
        });
      } else {
        console.log(`   → User exists: ${userData.userName}`);
      }
    }
  }
}
