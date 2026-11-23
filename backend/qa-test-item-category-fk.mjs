import dotenv from 'dotenv';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  const user = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    ['qa.user.20261026@example.com']
  );

  if (!user.rowCount) {
    throw new Error('QA seller account was not found.');
  }

  await pool.query(
    `INSERT INTO items
       (id, seller_id, category_id, title, description, status, category_fields)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      randomUUID(),
      user.rows[0].id,
      randomUUID(),
      'QA Invalid Category Test',
      'Temporary database constraint test',
      'PENDING_REVIEW',
      '{}'
    ]
  );

  console.log('UNEXPECTED: Item with nonexistent category was accepted.');
} catch (error) {
  console.log('EXPECTED DATABASE REJECTION');
  console.log('SQLSTATE:', error.code ?? 'N/A');
  console.log('CONSTRAINT:', error.constraint ?? 'N/A');
  if (!error.code) console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
