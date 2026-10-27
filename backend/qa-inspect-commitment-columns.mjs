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

  const auctionId = '174cad2c-b449-45b9-ae65-ec36485bee9d';
  const userId = user.rows[0].id;

  const existing = await pool.query(
    `SELECT 1 FROM bid_commitments
     WHERE auction_id = $1 AND user_id = $2`,
    [auctionId, userId]
  );

  if (existing.rowCount) {
    throw new Error(
      'A commitment already exists for this auction and user; choose another QA user or auction.'
    );
  }

  const columns = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'bid_commitments'
     ORDER BY ordinal_position`
  );

  console.log('COMMITMENT TABLE COLUMNS:');
  console.log(columns.rows.map(row => row.column_name).join(', '));
  console.log('No test rows inserted yet; transaction will be rolled back.');
} catch (error) {
  console.log('TEST SETUP ISSUE');
  console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
