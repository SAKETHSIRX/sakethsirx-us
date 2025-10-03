import dotenv from 'dotenv';
import { dbRun, dbAll } from '../config/database-manager.js';

dotenv.config();

console.log('🔧 Migrating OTP/email verification columns...');

const run = async () => {
  const isPostgres = process.env.DB_TYPE === 'postgres';

  try {
    if (isPostgres) {
      // Postgres: add columns if not exists
      await dbRun(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`
      );
      await dbRun(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10)`
      );
      await dbRun(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP`
      );
      console.log('✅ PostgreSQL columns ensured');
    } else {
      // SQLite: check columns and add if missing
      const columns = await dbAll(`PRAGMA table_info(users)`);
      const names = (columns || []).map(c => c.name);

      const addColumn = async (sql) => {
        try { await dbRun(sql); } catch (_) {}
      };

      if (!names.includes('email_verified')) {
        await addColumn(`ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0`);
        console.log('✅ Added email_verified');
      }
      if (!names.includes('verification_code')) {
        await addColumn(`ALTER TABLE users ADD COLUMN verification_code TEXT`);
        console.log('✅ Added verification_code');
      }
      if (!names.includes('verification_expires')) {
        await addColumn(`ALTER TABLE users ADD COLUMN verification_expires DATETIME`);
        console.log('✅ Added verification_expires');
      }
    }

    console.log('🎉 Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message || err);
    process.exit(1);
  }
};

run();