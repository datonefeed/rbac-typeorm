import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../models/user';
import { Role } from '../models/role';
import { Permission } from '../models/permission';
import { RolePermission } from '../models/role_permission';
import { UserRole } from '../models/user_role';
import { Company } from '../models/company';
import { UserCompany } from '../models/user_company';
import { Project } from '../models/project';
import { AccessToken } from '../models/access_token';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '123456',
  database: process.env.DATABASE_NAME || 'rbac_db',
  synchronize: false, 
  logging: false, // Disable TypeORM logging, use Pino instead
  maxQueryExecutionTime: 1000,
  entities: [
    User,
    Role,
    Permission,
    RolePermission,
    UserRole,
    Company,
    UserCompany,
    Project,
    AccessToken
  ],
  migrations: [__dirname + '/../database/migrations/**/*.{js,ts}'],
  subscribers: [],
});

let initialized = false;

export async function initializeDatabase(): Promise<DataSource> {
  if (initialized) {
    return AppDataSource;
  }
  
  try {
    await AppDataSource.initialize();
    console.log('TypeORM Data Source has been initialized!');
    initialized = true;
    return AppDataSource;
  } catch (err) {
    console.error('Error during TypeORM Data Source initialization:', err);
    throw err;
  }
}
