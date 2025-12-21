const pool = require("../db/pool");

// =======================
// GET ALL REGISTRATIONS
// =======================
exports.getAllRegistrations = async () => {
  const result = await pool.query(
    "SELECT * FROM exam_registrations ORDER BY created_at DESC"
  );
  return result.rows;
};

// =======================
// GET REGISTRATION BY ID
// =======================
exports.getRegistrationById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM exam_registrations WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

// =======================
// UPDATE STATUS ONLY
// =======================
exports.updateStatus = async (id, status) => {
  await pool.query(
    "UPDATE exam_registrations SET status = $1 WHERE id = $2",
    [status, id]
  );
};

// =======================
// APPROVE + REG NUMBER (LEGACY – KEEP)
// =======================
exports.approveWithRegistrationNumber = async (id, registrationNumber) => {
  await pool.query(
    `
    UPDATE exam_registrations
    SET status = 'APPROVED',
        registration_number = $1,
        approved_at = NOW()
    WHERE id = $2
    `,
    [registrationNumber, id]
  );
};

// =======================
// UPDATE PHOTO PATH
// =======================
exports.updatePhotoPath = async (id, newPhotoPath) => {
  await pool.query(
    "UPDATE exam_registrations SET photo = $1 WHERE id = $2",
    [newPhotoPath, id]
  );
};

// =======================
// UPDATE PDF PATH
// =======================
exports.updatePDFPath = async (id, pdfPath) => {
  await pool.query(
    "UPDATE exam_registrations SET proof_pdf_path = $1 WHERE id = $2",
    [pdfPath, id]
  );
};

// =======================
// REJECTION REASON
// =======================
exports.rejectRegistrationWithReason = async (id, reason) => {
  await pool.query(
    `
    UPDATE exam_registrations
    SET status = 'REJECTED',
        rejection_reason = $1,
        reviewed_at = NOW()
    WHERE id = $2
    `,
    [reason, id]
  );
};

// =======================
// APPROVE APPLICATION (FINAL – SEQUENCE BASED)
// =======================
exports.approveApplication = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️. Lock row
    const appRes = await client.query(
      `
      SELECT *
      FROM exam_registrations
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    const application = appRes.rows[0];
    if (!application) {
      throw new Error("Application not found");
    }

    if (application.status !== "PENDING") {
      throw new Error("Application already processed");
    }

    // 2️. Ambil running number dari DB sequence
    const seqRes = await client.query(
      "SELECT nextval('topik_registration_seq') AS seq"
    );
    const runningNo = seqRes.rows[0].seq;

    // 3️. Normalize test level
    const testLevel = application.test_level?.trim().toUpperCase();

    let levelCode;
    if (testLevel === "TOPIK I") levelCode = "7";
    else if (testLevel === "TOPIK II") levelCode = "8";
    else throw new Error("Invalid TOPIK level");

    // 4️. Bina registration number (11 DIGIT, NO DASH)
    const institutionCode = "021001";
    const registrationNumber =
      `${institutionCode}${levelCode}${String(runningNo).padStart(4, "0")}`;

    // 5️. Update DB
    await client.query(
      `
      UPDATE exam_registrations
      SET status = 'APPROVED',
          registration_number = $1,
          approved_at = NOW()
      WHERE id = $2
      `,
      [registrationNumber, id]
    );

    await client.query("COMMIT");

    return { registrationNumber };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
