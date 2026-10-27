import dotenv from 'dotenv';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  await pool.query(
    `INSERT INTO bids (auction_id, bidder_id, amount, request_id)
     VALUES ($1, $2, $3, $4)`,
    [
      '174cad2c-b449-45b9-ae65-ec36485bee9d',
      randomUUID(),
      100,
      randomUUID()
    ]
  );

  console.log('UNEXPECTED: Bid referencing a nonexistent bidder was accepted.');
} catch (error) {
  console.log('EXPECTED DATABASE REJECTION');
  console.log('SQLSTATE:', error.code ?? 'N/A');
  console.log('CONSTRAINT:', error.constraint ?? 'N/A');
  if (!error.code) console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
