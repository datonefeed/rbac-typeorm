require('reflect-metadata');
const { AppDataSource } = require('./src/config/typeorm');

async function runMigrations() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('Running migrations...');
    const migrations = await AppDataSource.runMigrations({
      transaction: 'all'
    });
    
    if (migrations.length === 0) {
      console.log('No pending migrations');
    } else {
      console.log(`Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.name}`);
      });
    }
    
    await AppDataSource.destroy();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
