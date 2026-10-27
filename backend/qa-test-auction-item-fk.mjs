import dotenv from 'dotenv';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  try {
    await pool.query(`
      INSERT INTO auctions (
        item_id, visibility, starting_price, current_price,
        minimum_increment, start_time, end_time, status
      )
      VALUES ($1, 'PUBLIC', 100, 100, 10,
              NOW() + INTERVAL '5 minutes',
              NOW() + INTERVAL '1 hour',
              'SCHEDULED')
    `, [randomUUID()]);

    console.log('UNEXPECTED: Auction with a nonexistent item was accepted.');
  } catch (error) {
    console.log('EXPECTED DATABASE REJECTION');
    console.log('SQLSTATE:', error.code);
    console.log('CONSTRAINT:', error.constraint);
  }
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
