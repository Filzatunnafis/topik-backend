const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },

  max: 1,                     
  connectionTimeoutMillis: 15000,

  statement_timeout: 10000,
  query_timeout: 10000,

  prepareThreshold: 0
});

module.exports = pool;
