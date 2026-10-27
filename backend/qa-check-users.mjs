import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

try {
  const result = await pool.query(`
    SELECT id, email, role
    FROM users
    WHERE email LIKE 'qa.%@example.com'
    ORDER BY email
  `);

  console.table(result.rows);
} catch (error) {
  console.error('Database query failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
