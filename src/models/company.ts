import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany
} from 'typeorm';
import { UserCompany } from './user_company';
import { Project } from './project';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'company_code', type: 'varchar', length: 50, unique: true })
  companyCode: string;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  companyName: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => UserCompany, userCompany => userCompany.company)
  userCompanies: UserCompany[];

  @OneToMany(() => Project, project => project.company)
  projects: Project[];
}
