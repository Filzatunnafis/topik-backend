// controllers/admin.controller.js

const fs = require("fs");
const path = require("path");

const adminService = require("../services/admin.service");
const emailService = require("../services/email.service");
const {
  generateProofPDF: generateProofPDFService
} = require("../services/pdfGenerator.service");

// =======================
// GET ALL REGISTRATIONS
// =======================
exports.getRegistrations = async (req, res) => {
  try {
    const data = await adminService.getAllRegistrations();
    res.json(data);
  } catch (err) {
    console.error("GET REGISTRATIONS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
};

// =======================
// GET REGISTRATION BY ID
// =======================
exports.getRegistrationById = async (req, res) => {
  try {
    const data = await adminService.getRegistrationById(req.params.id);
    if (!data) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.json(data);
  } catch (err) {
    console.error("GET REGISTRATION ERROR:", err);
    res.status(500).json({ error: "Failed to fetch application" });
  }
};

// =======================
// APPROVE REGISTRATION
// =======================
exports.approveRegistration = async (req, res) => {
  try {
    const id = req.params.id;

    // SEMUA logic berat dipindahkan ke service (atomic & safe)
    const result = await adminService.approveApplication(id);
    // result = { registrationNumber }

    res.json({
      message: "Application approved",
      registration_number: result.registrationNumber
    });

  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ error: err.message || "Approval failed" });
  }
};

// =======================
// REJECT REGISTRATION
// =======================
exports.rejectRegistration = async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        error: "Rejection reason is required"
      });
    }

    const application = await adminService.getRegistrationById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.status !== "PENDING") {
      return res.status(400).json({
        error: "Application already processed"
      });
    }

    await adminService.rejectRegistrationWithReason(id, reason);

    const applicantName =
      application.english_name ||
      application.korean_name ||
      "Applicant";

    await emailService.sendRejectionEmail(
      application.email,
      applicantName,
      reason
    );

    res.json({ message: "Application rejected" });

  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ error: "Reject failed" });
  }
};

// =======================
// GENERATE / VIEW PROOF PDF
// =======================
exports.generateProofPDF = async (req, res) => {
  try {
    const id = req.params.id;

    const application = await adminService.getRegistrationById(id);
    if (!application) {
      return res.status(404).send("Application not found");
    }

    if (application.status !== "APPROVED") {
      return res.status(400).send("Application not approved yet");
    }

    let pdfPath = application.proof_pdf_path;

    // ===============================
    // PDF BELUM WUJUD → GENERATE
    // ===============================
    if (!pdfPath) {
      pdfPath = await generateProofPDFService(application);

      await adminService.updatePDFPath(id, pdfPath);

      // SEND EMAIL (SEKALI SAHAJA)
      const applicantName =
        application.english_name ||
        application.korean_name ||
        "Applicant";

      await emailService.sendApprovalEmail(
        application.email,
        applicantName,
        application.registration_number,
        pdfPath
      );
    }

    // ===============================
    // SERVE PDF KE ADMIN 
    // ===============================
    res.sendFile(path.resolve(pdfPath));

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).send("Failed to generate PDF");
  }
};
