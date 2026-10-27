import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  const user = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    ['qa.admincheck.20261026@example.com']
  );

  const auction = await pool.query(
    'SELECT id FROM auctions WHERE id = $1',
    ['174cad2c-b449-45b9-ae65-ec36485bee9d']
  );

  if (!user.rowCount || !auction.rowCount) {
    throw new Error('QA user or auction was not found.');
  }

  await pool.query(
    `INSERT INTO bid_commitments (auction_id, user_id, status)
     VALUES ($1, $2, $3)`,
    [auction.rows[0].id, user.rows[0].id, 'INVALID']
  );

  console.log('UNEXPECTED: Invalid commitment status was accepted.');
} catch (error) {
  console.log('EXPECTED DATABASE REJECTION');
  console.log('SQLSTATE:', error.code ?? 'N/A');
  console.log('CONSTRAINT:', error.constraint ?? 'N/A');
  if (!error.code) console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
