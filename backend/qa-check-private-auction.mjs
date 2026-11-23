import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(
    `SELECT id, visibility, status, item_id, start_time, end_time
     FROM auctions
     WHERE id = $1`,
    ['faad8455-cd98-4f3f-bc37-c444baa548d2']
  );
  console.log(result.rows);
} catch (error) {
  console.error(error.message);
} finally {
  await pool.end();
}
