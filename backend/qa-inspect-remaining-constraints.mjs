import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(`
    SELECT
      rel.relname AS table_name,
      con.conname AS constraint_name,
      con.contype AS constraint_type,
      pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname IN ('bids', 'bid_commitments', 'sessions')
    ORDER BY rel.relname, con.contype, con.conname
  `);

  for (const row of result.rows) {
    console.log(
      `${row.table_name} | ${row.constraint_name} | ${row.constraint_type} | ${row.definition}`
    );
  }
} catch (error) {
  console.log('INSPECTION FAILED');
  console.log(error.message);
} finally {
  await pool.end();
}
