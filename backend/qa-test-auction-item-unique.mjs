import dotenv from 'dotenv';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  const itemId = 'c13555f7-e118-47a1-9517-cc4bcba71aee';

  const existing = await pool.query(
    'SELECT id FROM auctions WHERE item_id = $1',
    [itemId]
  );

  if (!existing.rowCount) {
    throw new Error('No existing auction found for the QA test item.');
  }

  await pool.query(
    `INSERT INTO auctions
       (id, item_id, visibility, access_code_hash,
        starting_price, current_price, minimum_increment,
        start_time, end_time, status)
     VALUES ($1, $2, 'PUBLIC', NULL,
             100, 100, 10, NOW(), NOW() + INTERVAL '1 hour', 'SCHEDULED')`,
    [randomUUID(), itemId]
  );

  console.log('UNEXPECTED: The same item was accepted in a second auction.');
} catch (error) {
  console.log('EXPECTED DATABASE REJECTION');
  console.log('SQLSTATE:', error.code ?? 'N/A');
  console.log('CONSTRAINT:', error.constraint ?? 'N/A');
  if (!error.code) console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
