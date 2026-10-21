import { Pool } from 'pg';
import type { QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test connection
pool.query('SELECT NOW()', (err: Error, res: QueryResult<any>) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to Neon successfully!');
    console.log('Database time:', res.rows[0].now);
  }
});

export default pool;
