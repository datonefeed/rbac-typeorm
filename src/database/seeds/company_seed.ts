import { DataSource } from 'typeorm';
import { Company } from '../../models/company';

interface FactoryManager {
  create<T = any>(entityName: string, overrides?: Partial<T>): Promise<T>;
  createMany<T = any>(entityName: string, count: number, overrides?: Partial<T>): Promise<T[]>;
}

export default class CompanySeed {
  async run(factory: FactoryManager, connection: DataSource): Promise<Record<string, Company>> {
    console.log('\nSeeding companies...');

    const companyRepo = connection.getRepository(Company);
    
    const companiesData = [
      { companyCode: 'COMPANY_A', companyName: 'Công ty A' },
      { companyCode: 'COMPANY_B', companyName: 'Công ty B' },
    ];

    const companies: Record<string, Company> = {};
    for (const compData of companiesData) {
      let company = await companyRepo.findOne({ 
        where: { companyCode: compData.companyCode } 
      });
      if (!company) {
        company = await companyRepo.save(compData);
        console.log(`   Created company: ${compData.companyName}`);
      } else {
        console.log(`   Company exists: ${compData.companyName}`);
      }
      companies[compData.companyCode] = company;
    }

    return companies;
  }
}
