import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(
    'SELECT id, title, status FROM items WHERE id = $1',
    ['c13555f7-e118-47a1-9517-cc4bcba71aee']
  );
  console.table(result.rows);
} finally {
  await pool.end();
}
