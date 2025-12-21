const pool = require("../db/pool");

async function generateRegistrationNumber(testLevel) {
  // Institution code 
  const institutionCode = "021001";

  // TOPIK I → 7, TOPIK II → 8
  const middle = testLevel === "TOPIK I" ? "7" : "8";

  // Kira running number ikut level
  const result = await pool.query(
    `
    SELECT COUNT(*) 
    FROM exam_registrations
    WHERE status = 'APPROVED'
    AND test_level = $1
    `,
    [testLevel]
  );

  const running = parseInt(result.rows[0].count) + 1;

  return `${institutionCode}-${middle}-${String(running).padStart(5, "0")}`;
}

module.exports = generateRegistrationNumber;
