import { Faker } from '@faker-js/faker';

interface FactoryManager {
  define(entityName: string, callback: (faker: Faker) => any): void;
}

export default (factoryManager: FactoryManager): void => {
  if (factoryManager) {
    factoryManager.define('Role', (faker: Faker) => {
      return {
        roleName: faker.helpers.arrayElement(['ADMIN', 'USER', 'MANAGER']),
        description: faker.lorem.sentence(),
        isActive: true,
      };
    });
  }
};
