import dotenv from 'dotenv';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  const item = await pool.query(
    `SELECT id FROM items
     WHERE id = $1`,
    ['c13555f7-e118-47a1-9517-cc4bcba71aee']
  );

  if (!item.rowCount) {
    throw new Error('QA test item was not found.');
  }

  await pool.query(
    `INSERT INTO auctions
       (id, item_id, visibility, access_code_hash,
        starting_price, current_price, minimum_increment,
        start_time, end_time, status)
     VALUES ($1, $2, 'PUBLIC', 'qa-test-hash',
             100, 100, 10, NOW(), NOW() + INTERVAL '1 hour', 'SCHEDULED')`,
    [randomUUID(), item.rows[0].id]
  );

  console.log('UNEXPECTED: Public auction with access_code_hash was accepted.');
} catch (error) {
  console.log('EXPECTED DATABASE REJECTION');
  console.log('SQLSTATE:', error.code ?? 'N/A');
  console.log('CONSTRAINT:', error.constraint ?? 'N/A');
  if (!error.code) console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
