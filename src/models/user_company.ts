import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './user';
import { Company } from './company';

@Entity('user_companies')
export class UserCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, user => user.userCompanies)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Company, company => company.userCompanies)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
