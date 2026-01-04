// =======================
// REGISTRATION SERVICE
// =======================
// Digunakan masa applicant submit
// BUKAN untuk admin approve
// NDA generate registration number

const { safeQuery } = require("../db/safeQuery");
const applicationService = require("./application.service");
// ⬆ Service khas untuk generate APPLICATION NUMBER

module.exports.createRegistration = async (data) => {

  // =======================
  // 1. Ambil data dari controller
  // =======================
  const {
    application_number,
    test_level,
    englishName,
    koreanName,
    nationality,
    gender,
    dobIntl,
    address,
    home_phone,
    calling_code,
    mobile_phone,
    email,
    occupation,
    motive,
    purpose,
    photo
  } = data;


  // =======================
  // 3. Normalisasi data
  // =======================
  const finalEnglishName = englishName || null;
  const finalKoreanName  = koreanName || null;
  const finalDOB         = dobIntl || null;
  const finalMotive      = motive || null;
  const finalPurpose     = purpose || null;

  // =======================
  // 4. Insert ke DB
  // =======================
  await safeQuery(
    `
    INSERT INTO exam_registrations (
      application_number,
      status,
      testing_place,
      testing_area,
      test_level,
      english_name,
      korean_name,
      nationality,
      gender,
      date_of_birth,
      address,
      home_phone,
      calling_code,   
      mobile_phone,
      email,
      occupation,
      motive_of_application,
      purpose_of_application,
      photo
    )
    VALUES (
      $1, 'PENDING',
      $2, $3, $4,
      $5, $6, $7, $8, $9,
      $10, $11, $12, $13, $14,
      $15, $16, $17, $18
    )
    `,
    [
      application_number,
      "쿠알라 룸푸르대학교 (UNiKL)", 
      "쿠알라 룸푸르",               
      test_level,
      finalEnglishName,
      finalKoreanName,
      nationality,
      gender,
      finalDOB,
      address,
      home_phone,
      calling_code,
      mobile_phone,
      email,
      occupation,
      finalMotive,
      finalPurpose,
      photo
    ]
  );

  // =======================
  // 5. Return ke controller
  // =======================
  return {
    application_number,
    status: "PENDING"
  };
};
