import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(`
    SELECT id, status, start_time, end_time, clock_timestamp() AS database_time
    FROM auctions
    WHERE id = $1
  `, ['174cad2c-b449-45b9-ae65-ec36485bee9d']);

  console.table(result.rows);
} catch (error) {
  console.error('Database query failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
