const registrationService = require("../services/registration.service");
const emailService = require("../services/email.service");


const supabase = require("../services/supabaseStorage");
const fs = require("fs");
const path = require("path");

exports.registerStudent = async (req, res) => {
  try {

    /* ===============================
       1. UPLOAD PHOTO KE SUPABASE
       =============================== */

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Photo required" });
    }

    const file = req.file;
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}${ext}`;

    // Upload ke Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("student-photos")
      .upload(filename, fs.readFileSync(file.path), {
        contentType: file.mimetype
      });

    if (uploadError) {
      console.error("SUPABASE UPLOAD ERROR:", uploadError);
      return res.status(500).json({ success: false });
    }

    // PUBLIC URL
    const { data } = supabase.storage
      .from("student-photos")
      .getPublicUrl(filename);

    const photoUrl = data.publicUrl;

    // Padam file sementara dari server
    fs.unlinkSync(file.path);

    /* ===============================
       2. SIMPAN APPLICATION KE DB
       =============================== */

    const result = await registrationService.createRegistration({
      ...req.body,
      photoPath: photoUrl    // ← SATU-SATUNYA PERUBAHAN LOGIK
    });

    /* ===============================
       3. EMAIL CONFIRMATION 
       =============================== */

    const applicantName = req.body.englishName || req.body.koreanName;

    await emailService.sendSubmissionEmail(
      req.body.email,
      applicantName,
      result.application_number
    );

    /* ===============================
       4. RESPONSE 
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
