import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name
  `);

  console.table(result.rows);
} catch (error) {
  console.error('Database query failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
