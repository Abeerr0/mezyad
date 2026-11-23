import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  try {
    await pool.query(`
      UPDATE items
      SET status = $1
      WHERE id = $2
    `, [
      'INVALID_STATUS',
      'c13555f7-e118-47a1-9517-cc4bcba71aee'
    ]);

    console.log('UNEXPECTED: Invalid item status was accepted.');
  } catch (error) {
    console.log('EXPECTED DATABASE REJECTION');
    console.log('SQLSTATE:', error.code);
    console.log('CONSTRAINT:', error.constraint);
  }
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
