// =========================== //
// TOPIK REGISTRATION BACKEND //
// =========================== //

console.log("SERVER.JS FILE LOADED");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

// ======================= //
// ENSURE UPLOAD FOLDERS   //
// ======================= //

const uploadDir = path.join(__dirname, "uploads", "images");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("UPLOAD DIR CREATED:", uploadDir);
}

const registerRoutes = require("./routes/register.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// ======================= //
// MIDDLEWARE              //
// ======================= //

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  })
);

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});

// ======================= //
// STATIC FILES            //
// ======================= //

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

app.use(
  "/admin-ui",
  express.static(path.join(__dirname, "ADMIN"))
);

// ======================= //
// ADMIN LOGIN SHORTCUT    //
// ======================= //

app.get("/admin", (req, res) => {
  res.redirect("/admin-ui/login.html");
});

// ======================= //
// ROUTES (API)            //
// ======================= //

app.use("/register", registerRoutes);
app.use("/admin", adminRoutes);

// ======================= //
// TEST SERVER             //
// ======================= //

app.get("/", (req, res) => {
  res.send("TOPIK Backend is running.");
});

// ======================= //
// START SERVER            //
// ======================= //

console.log(
  "SIGNATURE EXISTS:",
  fs.existsSync(path.join(__dirname, "public", "signature.png"))
);

app.listen(PORT, () => {
  console.log("SERVER RUNNING ON PORT", PORT);
});
