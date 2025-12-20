const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");

// =======================
// GET
// =======================
router.get("/registrations", adminController.getRegistrations);
router.get("/registrations/:id", adminController.getRegistrationById);
router.get("/registrations/:id/pdf", adminController.generateProofPDF);

// =======================
// POST
// =======================
router.post("/registrations/:id/approve", adminController.approveRegistration);
router.post("/registrations/:id/reject", adminController.rejectRegistration);

module.exports = router;
