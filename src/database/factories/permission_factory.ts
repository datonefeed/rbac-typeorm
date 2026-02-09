import { Faker } from '@faker-js/faker';

interface FactoryManager {
  define(entityName: string, callback: (faker: Faker) => any): void;
}

export default (factoryManager: FactoryManager): void => {
  if (factoryManager) {
    factoryManager.define('Permission', (faker: Faker) => {
      return {
        permissionName: faker.helpers.arrayElement(['READ', 'WRITE', 'DELETE', 'UPDATE']),
        description: faker.lorem.sentence(),
        isActive: true,
      };
    });
  }
};
