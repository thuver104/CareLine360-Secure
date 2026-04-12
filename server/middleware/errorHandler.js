const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Only log unexpected server errors, not business logic errors (4xx)
  if (statusCode >= 500) {
    console.error(err.stack);
  }

  // Mongoose validation error (model-level validators)
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  // Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: `Invalid ${err.path || "ID"} format` });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `Duplicate value for ${field}` });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token has expired" });
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    const multerMessages = {
      LIMIT_FILE_SIZE: "File is too large",
      LIMIT_FILE_COUNT: "Too many files uploaded",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field",
      LIMIT_FIELD_KEY: "Field name too long",
      LIMIT_FIELD_VALUE: "Field value too long",
      LIMIT_PART_COUNT: "Too many parts",
    };
    return res.status(400).json({
      success: false,
      message: multerMessages[err.code] || "File upload error",
    });
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Malformed JSON in request body" });
  }

  // Payload too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large" });
  }

  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
