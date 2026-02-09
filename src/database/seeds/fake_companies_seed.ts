import { DataSource } from 'typeorm';
import { Company } from '../../models/company';

interface FactoryManager {
  create<T = any>(entityName: string, overrides?: Partial<T>): Promise<T>;
  createMany<T = any>(entityName: string, count: number, overrides?: Partial<T>): Promise<T[]>;
}

export default class FakeCompaniesSeed {
  async run(factory: FactoryManager, connection: DataSource): Promise<void> {
    console.log('\nSeeding fake companies...');

    const companyRepo = connection.getRepository(Company);
    
    // Check if we should skip (optional: only run in dev)
    const existingCount = await companyRepo.count();
    if (existingCount > 10) {
      console.log('   Many companies already exist, skipping fake data');
      return;
    }

    const fakeCompanies = await factory.createMany<Company>('Company', 5);
    
    for (const companyData of fakeCompanies) {
      const exists = await companyRepo.findOne({ 
        where: { companyCode: companyData.companyCode } 
      });
      
      if (!exists) {
        await companyRepo.save(companyData);
        console.log(`   Created fake company: ${companyData.companyName}`);
      }
    }
  }
}
