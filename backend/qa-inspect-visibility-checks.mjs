import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'public.auctions'::regclass
      AND conname IN ('auctions_check1', 'auctions_visibility_check')
    ORDER BY conname
  `);

  for (const row of result.rows) {
    console.log(`${row.conname}: ${row.definition}`);
  }
} catch (error) {
  console.log('INSPECTION FAILED');
  console.log(error.message);
} finally {
  await pool.end();
}
