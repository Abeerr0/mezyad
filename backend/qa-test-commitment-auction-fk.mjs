import dotenv from 'dotenv';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  const user = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    ['qa.admincheck.20261026@example.com']
  );

  if (!user.rowCount) {
    throw new Error('QA user was not found.');
  }

  await pool.query(
    `INSERT INTO bid_commitments (auction_id, user_id, status)
     VALUES ($1, $2, $3)`,
    [randomUUID(), user.rows[0].id, 'PENDING']
  );

  console.log('UNEXPECTED: Commitment for nonexistent auction was accepted.');
} catch (error) {
  console.log('EXPECTED DATABASE REJECTION');
  console.log('SQLSTATE:', error.code ?? 'N/A');
  console.log('CONSTRAINT:', error.constraint ?? 'N/A');
  if (!error.code) console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
