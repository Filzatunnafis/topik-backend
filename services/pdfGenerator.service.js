const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// =======================
// HELPER 
// =======================

const fetch = require("node-fetch");

async function getStudentPhotoBase64(photoUrl) {
  if (!photoUrl) return "";

  try {
    const res = await fetch(photoUrl);
    if (!res.ok) {
      console.warn("Photo URL not accessible:", photoUrl);
      return "";
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    console.error("PHOTO FETCH ERROR:", err.message);
    return "";
  }
}


// =======================
// FORMAT DOB (ISO)
// =======================
function formatDOB(dob) {
  if (!dob) return "";
  return new Date(dob).toISOString().split("T")[0];
}

// =======================
// GENERATE PROOF PDF
// =======================
exports.generateProofPDF = async (application) => {
  // 1️. Pastikan folder wujud
  const pdfDir = path.join("uploads", "pdf");
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  // 2️. Baca template HTML
  const templatePath = path.join(
    __dirname,
    "../templates/proofRegistration.html"
  );

  let html = fs.readFileSync(templatePath, "utf8");

  // 3️. Prepare data
  const year = new Date().getFullYear();

  const fullNameRaw =
    application.english_name ||
    application.korean_name ||
    "APPLICANT";

  const fullName = fullNameRaw
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const registrationNumber = application.registration_number;

  const pdfFileName = `${registrationNumber}_${fullName}.pdf`;
  const pdfPath = path.join(pdfDir, pdfFileName);

  // 4️. Inject HTML placeholders
  const replacements = {
    "{{year}}": year,
    "{{registration_number}}": registrationNumber,
    "{{test_level}}": application.test_level || "",
    "{{name_korean}}": application.korean_name || "",
    "{{name_english}}": application.english_name || "",
    "{{gender}}": application.gender || "",
    "{{dob}}": formatDOB(application.date_of_birth),
    "{{photo_base64}}": await getStudentPhotoBase64(application.photo),
    "{{signature_base64}}": getSignatureBase64()
  };

  for (const key in replacements) {
    html = html.replaceAll(key, replacements[key]);
  }

  // 5️. Generate PDF (Puppeteer)
  const browser = await puppeteer.launch({
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--allow-file-access-from-files",
    "--disable-dev-shm-usage",
    "--disable-gpu"
  ]
 });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "10mm",
      bottom: "10mm",
      left: "10mm",
      right: "10mm"
    }
  });

  await browser.close();

  return pdfPath;
};
