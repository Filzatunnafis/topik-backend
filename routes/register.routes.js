const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const registerController = require("../controllers/register.controller");

// =======================
// MULTER CONFIG
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

// =======================
// STUDENT REGISTRATION
// =======================
router.post(
  "/",
  upload.single("photo"), 
  registerController.registerStudent
);

module.exports = router;
