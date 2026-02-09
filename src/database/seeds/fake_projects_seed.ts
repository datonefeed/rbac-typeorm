import { DataSource } from 'typeorm';
import { Project } from '../../models/project';
import { Company } from '../../models/company';

interface FactoryManager {
  create<T = any>(entityName: string, overrides?: Partial<T>): Promise<T>;
  createMany<T = any>(entityName: string, count: number, overrides?: Partial<T>): Promise<T[]>;
}

export default class FakeProjectsSeed {
  async run(factory: FactoryManager, connection: DataSource): Promise<void> {
    console.log('\nSeeding fake projects...');

    const projectRepo = connection.getRepository(Project);
    const companyRepo = connection.getRepository(Company);
    
    const companies = await companyRepo.find({ take: 5 });
    if (companies.length === 0) {
      console.log('   No companies found, skipping fake projects');
      return;
    }

    // Create 3 projects per company
    for (const company of companies) {
      for (let i = 1; i <= 3; i++) {
        const projectData = {
          projectCode: `PRJ_${company.companyCode}_${i}`,
          projectName: `Project ${i} - ${company.companyName}`,
          description: `Fake project ${i} for ${company.companyName}`,
          companyId: company.id,
        };

        const exists = await projectRepo.findOne({ 
          where: { projectCode: projectData.projectCode } 
        });
        
        if (!exists) {
          await projectRepo.save(projectData);
          console.log(`   Created fake project: ${projectData.projectName}`);
        }
      }
    }
  }
}
