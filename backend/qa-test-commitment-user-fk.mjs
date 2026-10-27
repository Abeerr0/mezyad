import dotenv from 'dotenv';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  await pool.query(
    `INSERT INTO bid_commitments (auction_id, user_id, status)
     VALUES ($1, $2, $3)`,
    [
      '174cad2c-b449-45b9-ae65-ec36485bee9d',
      randomUUID(),
      'PENDING'
    ]
  );

  console.log('UNEXPECTED: Commitment for nonexistent user was accepted.');
} catch (error) {
  console.log('EXPECTED DATABASE REJECTION');
  console.log('SQLSTATE:', error.code ?? 'N/A');
  console.log('CONSTRAINT:', error.constraint ?? 'N/A');
  if (!error.code) console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
