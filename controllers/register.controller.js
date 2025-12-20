const registrationService = require("../services/registration.service");
const emailService = require("../services/email.service");

exports.registerStudent = async (req, res) => {
  try {
    // Simpan application ke DB
    const result = await registrationService.createRegistration({
      ...req.body,
      photoPath: req.file.path
    });

    // Ambil nama pemohon (English → Korean fallback)
    const applicantName = req.body.englishName || req.body.koreanName;

    // Hantar email confirmation (NO PDF)
    await emailService.sendSubmissionEmail(
      req.body.email,
      applicantName,
      result.application_number
    );

    // Response ke frontend
    res.status(201).json({
      success: true,
      application_number: result.application_number,
      status: "PENDING"
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ success: false });
  }
};
