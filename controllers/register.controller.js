const registrationService = require("../services/registration.service");
const emailService = require("../services/email.service");
const { uploadStudentPhoto } = require("../services/supabaseStorage");
const applicationService = require("../services/application.service");

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
       2. GENERATE APPLICATION NUMBER
    =============================== */
    const applicationNumber =
      applicationService.generateApplicationNumber();

    const fullName =
      req.body.englishName || req.body.koreanName || "UNKNOWN";

    /* ===============================
       3. UPLOAD PHOTO (ONCE)
    =============================== */
    const photoUrl = await uploadStudentPhoto(
      req.file,
      applicationNumber,
      fullName
    );

    if (!photoUrl) {
      throw new Error("Photo upload failed");
    }

    /* ===============================
       4. SAVE APPLICATION TO DB
    =============================== */
    const result = await registrationService.createRegistration({
      ...req.body,
      application_number: applicationNumber,
      photo: photoUrl
    });

    /* ===============================
       5. EMAIL CONFIRMATION
    =============================== */
    const applicantName = fullName;

    await emailService.sendSubmissionEmail(
      req.body.email,
      applicantName,
      applicationNumber
    );

    /* ===============================
       6. RESPONSE
    =============================== */
    res.status(201).json({
      success: true,
      application_number: applicationNumber,
      status: "PENDING"
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ success: false });
  }
};
