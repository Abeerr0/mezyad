import dotenv from 'dotenv';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  const category = await pool.query(
    'SELECT id FROM categories LIMIT 1'
  );

  if (!category.rowCount) {
    throw new Error('No category exists for the QA test.');
  }

  await pool.query(
    `INSERT INTO items
       (id, seller_id, category_id, title, description, status, category_fields)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      randomUUID(),
      randomUUID(),
      category.rows[0].id,
      'QA Invalid Seller Test',
      'Temporary database constraint test',
      'PENDING_REVIEW',
      '{}'
    ]
  );

  console.log('UNEXPECTED: Item with nonexistent seller was accepted.');
} catch (error) {
  console.log('EXPECTED DATABASE REJECTION');
  console.log('SQLSTATE:', error.code ?? 'N/A');
  console.log('CONSTRAINT:', error.constraint ?? 'N/A');
  if (!error.code) console.log('ERROR:', error.message);
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
