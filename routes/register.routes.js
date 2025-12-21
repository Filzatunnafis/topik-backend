const express = require("express");
const router = express.Router();
const multer = require("multer");

const registerController = require("../controllers/register.controller");

// =======================
// MULTER CONFIG (MEMORY)
// =======================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB (ikut spesifikasi TOPIK)
  }
});

// =======================
// STUDENT REGISTRATION
// =======================
router.post(
  "/",
  upload.single("photo"),   // 🔑 file ada dalam req.file.buffer
  registerController.registerStudent
);

module.exports = router;
