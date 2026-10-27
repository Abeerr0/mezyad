import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  try {
    await pool.query(`
      UPDATE auctions
      SET minimum_increment = 0
      WHERE id = $1
    `, ['174cad2c-b449-45b9-ae65-ec36485bee9d']);

    console.log('UNEXPECTED: Zero minimum increment was accepted.');
  } catch (error) {
    console.log('EXPECTED DATABASE REJECTION');
    console.log('SQLSTATE:', error.code);
    console.log('CONSTRAINT:', error.constraint);
  }
} finally {
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
}
