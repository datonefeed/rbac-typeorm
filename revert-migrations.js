require('reflect-metadata');
const { AppDataSource } = require('./src/config/typeorm');

async function revertMigration() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('Reverting last migration...');
    await AppDataSource.undoLastMigration({
      transaction: 'all'
    });
    
    console.log('Successfully reverted migration');
    
    await AppDataSource.destroy();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error reverting migration:', error);
    process.exit(1);
  }
}

revertMigration();
