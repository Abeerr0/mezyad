import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  try {
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
    `, [
      'QA Duplicate Email Test',
      'qa.user.20261026@example.com',
      'not-a-real-password-hash',
      'USER'
    ]);

    console.log('UNEXPECTED: Duplicate email was accepted.');
  } catch (error) {
    console.log('EXPECTED DATABASE REJECTION');
    console.log('SQLSTATE:', error.code);
    console.log('CONSTRAINT:', error.constraint);
  }
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
