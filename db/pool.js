const { Pool } = require("pg");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },

  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,

  statement_timeout: 0,
  query_timeout: 0
});

module.exports = pool;
