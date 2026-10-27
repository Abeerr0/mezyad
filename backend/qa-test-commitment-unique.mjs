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
      'A commitment already exists for this auction and user. Test aborted to avoid conflicting with existing data.'
    );
  }

  const insertSql = `
    INSERT INTO bid_commitments
      (auction_id, user_id, status, sandbox_reference)
    VALUES ($1, $2, $3, $4)
  `;

  await pool.query(insertSql, [
    auctionId, userId, 'PENDING', `qa-${randomUUID()}`
  ]);

  try {
    await pool.query(insertSql, [
      auctionId, userId, 'PENDING', `qa-${randomUUID()}`
    ]);

    console.log('UNEXPECTED: Duplicate commitment was accepted.');
  } catch (error) {
    console.log('EXPECTED DATABASE REJECTION');
    console.log('SQLSTATE:', error.code ?? 'N/A');
    console.log('CONSTRAINT:', error.constraint ?? 'N/A');
  }
} catch (error) {
  console.log('TEST SETUP ISSUE');
  console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
