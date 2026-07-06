const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://keymarket:keymarket123@127.0.0.1:5432/keymarket',
});
pool.query('SELECT 1', (err, res) => {
  if (err) this.logger.error('DB connection error:', err);
  else this.logger.info('DB connected:', res.rows);
  pool.end();
});