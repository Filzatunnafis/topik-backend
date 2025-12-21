const registrationService = require("../services/registration.service");
const emailService = require("../services/email.service");
const { uploadStudentPhoto } = require("../services/supabaseStorage");

exports.registerStudent = async (req, res) => {
  try {

    /* ===============================
       1. VALIDATE PHOTO
      =============================== */
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Photo required"
      });
    }

    /* ===============================
       2. UPLOAD PHOTO TO SUPABASE
       =============================== */
    const photoUrl = await uploadStudentPhoto(req.file);

    /* ===============================
       3. SAVE APPLICATION TO DB
       =============================== */
    const result = await registrationService.createRegistration({
      ...req.body,
      photoPath: photoUrl   
    });

    /* ===============================
       4. EMAIL CONFIRMATION
       =============================== */
    const applicantName =
      req.body.englishName || req.body.koreanName;

    await emailService.sendSubmissionEmail(
      req.body.email,
      applicantName,
      result.application_number
    );

    /* ===============================
       5. RESPONSE
       =============================== */
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
