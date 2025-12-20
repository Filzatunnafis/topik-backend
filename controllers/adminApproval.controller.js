const fs = require("fs");
const path = require("path");
const pool = require("../db/pool");
const emailService = require("../services/email.service");
const { generateProofPDF } = require("../services/pdfGenerator.service");

// =======================
// HELPER: GENERATE REG NO
// =======================
function generateRegistrationNumber(testLevel, running) {
  const middle = testLevel === "TOPIK I" ? "7" : "8";
  return `021-${middle}-${String(running).padStart(3, "0")}`;
}

// =======================
// APPROVE APPLICATION
// =======================
exports.approveApplication = async (req, res) => {
  const { application_id } = req.params;

  try {
    const TABLE = "exam_registrations";

    // =======================
    // 1. GET APPLICATION
    // =======================
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLE} WHERE id = $1`,
      [application_id]
    );

    const app = rows[0];

    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (app.status !== "PENDING") {
      return res.status(400).json({ error: "Application already processed" });
    }

    // =======================
    // 2. GENERATE REG NO
    // =======================
    const regNo = generateRegistrationNumber(app.test_level, app.id);

    // =======================
    // 3. READ HTML TEMPLATE
    // =======================
    const htmlTemplate = fs.readFileSync(
      path.join(__dirname, "../templates/proofRegistration.html"),
      "utf8"
    );

    // =======================
    // 4. PREPARE DATA
    // =======================
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    // Format DOB → 04 JUL 2001
    const formattedDob = new Date(app.date_of_birth)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
      .toUpperCase();

    // =======================
    // 5. FILL HTML TEMPLATE
    // =======================
    const filledHTML = htmlTemplate
      .replace("{{year}}", app.test_year || "")
      .replace("{{registration_number}}", regNo)
      .replace("{{test_level}}", app.test_level || "")
      .replace("{{name_korean}}", app.korean_name || "")
      .replace("{{name_english}}", app.english_name || "")
      .replace("{{gender}}", app.gender || "")
      .replace("{{dob}}", formattedDob)

      // PHOTO → FULL URL
      .replace(
        "{{photo_url}}",
        app.photo ? `${BASE_URL}/${app.photo}` : ""
      )

      // SIGNATURE → LOCAL FILE PATH
      .replace(
        "{{signature_url}}",
        path.resolve("assets/signature.png")
      );

    // =======================
    // 6. GENERATE PDF
    // =======================
    const pdfPath = `uploads/pdf/proof_${regNo}.pdf`;

    await generateProofPDF(filledHTML, pdfPath);

    // =======================
    // 7. UPDATE DATABASE
    // =======================
    await pool.query(
      `
      UPDATE ${TABLE}
      SET status = 'APPROVED',
          registration_number = $1,
          proof_pdf_path = $2,
          approved_at = NOW()
      WHERE id = $3
      `,
      [regNo, pdfPath, application_id]
    );

    // =======================
    // 8. SEND APPROVAL EMAIL
    // =======================
    const applicantName =
      app.english_name ||
      app.korean_name ||
      "Applicant";

    await emailService.sendApprovalEmail(
      app.email,
      applicantName,
      regNo,
      pdfPath
    );

    // =======================
    // 9. RESPONSE
    // =======================
    res.json({
      success: true,
      registration_number: regNo
    });

  } catch (err) {
    console.error("APPROVAL ERROR:", err);
    res.status(500).json({ error: "Approval failed" });
  }
};
