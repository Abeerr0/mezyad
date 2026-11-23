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
    throw new Error('QA test user was not found.');
  }

  const requestId = randomUUID();
  const auctionId = '174cad2c-b449-45b9-ae65-ec36485bee9d';
  const bidderId = user.rows[0].id;

  for (let i = 0; i < 2; i++) {
    await pool.query(
      `INSERT INTO bids (auction_id, bidder_id, amount, request_id)
       VALUES ($1, $2, $3, $4)`,
      [auctionId, bidderId, 100 + i * 10, requestId]
    );
  }

  console.log('UNEXPECTED: Duplicate request_id was accepted.');
} catch (error) {
  console.log('EXPECTED DATABASE REJECTION');
  console.log('SQLSTATE:', error.code ?? 'N/A');
  console.log('CONSTRAINT:', error.constraint ?? 'N/A');
  if (!error.code) console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
