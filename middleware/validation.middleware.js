module.exports.validateRegistration = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "Student photo is required"
    });
  }

  if (!req.body.test_level) {
    return res.status(400).json({
      success: false,
      error: "Test level is required"
    });
  }

  next();
};

//== Validation Notes ==//

// 1. validate body

// 2. sanitize input

// 3. whitelist fields