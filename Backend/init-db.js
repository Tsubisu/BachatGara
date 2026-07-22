const fs = require('fs');
const path = require('path');
const db = require('./db');

async function initDB() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // First drop tables if they exist to apply new schema cleanly
    // Note: In production we would use migrations, but for dev we re-init
    console.log('Dropping old schema...');
    await db.query(`
      DROP TABLE IF EXISTS 
        sms_alerts,
        budget_allocations,
        budget_plans,
        budgets,
        subscriptions,
        savings_contributions,
        savings_goals,
        transactions,
        accounts,
        categories,
        otps,
        users 
      CASCADE;
    `);

    console.log('Applying new schema.sql...');
    await db.query(schemaSql);
    
    console.log('Database initialized successfully with new schema.');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  } finally {
    process.exit(0);
  }
}

initDB();
