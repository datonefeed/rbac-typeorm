import bcrypt from 'bcrypt';
import { Faker } from '@faker-js/faker';

interface FactoryManager {
  define(entityName: string, callback: (faker: Faker) => any): void;
}

export default (factoryManager: FactoryManager): void => {
  if (factoryManager) {
    factoryManager.define('User', (faker: Faker) => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      return {
        userName: faker.internet.username({ firstName, lastName }).toLowerCase(),
        fullName: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: bcrypt.hashSync('123456', 10),
        isActive: true,
      };
    });
  }
};
