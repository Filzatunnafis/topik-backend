const pool = require("./pool");

const safeQuery = async (sql, params = []) => {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    if (err.code === "ECONNRESET") {
      console.warn("Retrying DB query after connection reset...");
      return await pool.query(sql, params);
    }
    throw err;
  }
};

module.exports = { safeQuery };
