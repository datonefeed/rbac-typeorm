import 'reflect-metadata';
import { AppDataSource } from '../config/typeorm';
import { DataSource } from 'typeorm';
import path from 'path';
import fs from 'fs';
import { Faker } from '@faker-js/faker';

type FactoryCallback<T = any> = (faker: Faker) => T;

// Simple factory implementation
class FactoryManager {
  private definitions: Map<string, FactoryCallback> = new Map();

  define<T = any>(entityName: string, callback: FactoryCallback<T>): void {
    this.definitions.set(entityName, callback);
  }

  async create<T = any>(entityName: string, overrides: Partial<T> = {}): Promise<T> {
    const definition = this.definitions.get(entityName);
    if (!definition) {
      throw new Error(`Factory for ${entityName} not defined`);
    }
    
    const { faker } = await import('@faker-js/faker');
    const data = definition(faker);
    return { ...data, ...overrides } as T;
  }

  async createMany<T = any>(entityName: string, count: number, overrides: Partial<T> = {}): Promise<T[]> {
    const items: T[] = [];
    for (let i = 0; i < count; i++) {
      items.push(await this.create<T>(entityName, overrides));
    }
    return items;
  }
}

interface Seeder {
  run(factory: FactoryManager, connection: DataSource): Promise<void>;
}

async function runSeeds(): Promise<void> {
  try {
    console.log('Custom Seeding v1.0.0\n');
    
    await AppDataSource.initialize();
    console.log('Database connection established\n');

    // Load factories
    const factoryManager = new FactoryManager();
    const factoriesDir = path.join(__dirname, 'factories');
    if (fs.existsSync(factoriesDir)) {
      const factoryFiles = fs.readdirSync(factoriesDir)
        .filter(file => file.endsWith('.js') || file.endsWith('.ts'));
      
      console.log(`Loading ${factoryFiles.length} factory(ies)...`);
      for (const file of factoryFiles) {
        const factoryModule = await import(path.join(factoriesDir, file));
        const factoryLoader = factoryModule.default || factoryModule;
        if (typeof factoryLoader === 'function') {
          factoryLoader(factoryManager);
        }
        console.log(`   ✓ Loaded: ${file}`);
      }
      console.log('');
    }

    const seedsDir = path.join(__dirname, 'seeds');
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
      .sort(); //alphabet

    console.log(`Found ${seedFiles.length} seed(s)\n`);

    for (const file of seedFiles) {
      const seedModule = await import(path.join(seedsDir, file));
      const SeedClass = seedModule.default || seedModule;
      const seeder: Seeder = new SeedClass();
      
      console.log(`Running seed: ${file}`);
      await seeder.run(factoryManager, AppDataSource);
      console.log(`Completed: ${file}\n`);
    }

    await AppDataSource.destroy();
    console.log('All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();

export { FactoryManager };
export type { Seeder };
