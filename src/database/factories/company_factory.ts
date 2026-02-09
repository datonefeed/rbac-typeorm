import { Faker } from '@faker-js/faker';

interface FactoryManager {
  define(entityName: string, callback: (faker: Faker) => any): void;
}

export default (factoryManager: FactoryManager): void => {
  if (factoryManager) {
    factoryManager.define('Company', (faker: Faker) => {
      const companyName = faker.company.name();
      
      return {
        companyCode: faker.string.alphanumeric(6).toUpperCase(),
        companyName: companyName,
        isActive: true,
      };
    });
  }
};
