import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Company } from './company';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_code', type: 'varchar', length: 50, unique: true })
  projectCode: string;

  @Column({ name: 'project_name', type: 'varchar', length: 255 })
  projectName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'company_id', type: 'int' })
  companyId: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Company, company => company.projects)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
