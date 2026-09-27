const multer = require("multer");
const { fileTypeFromBuffer } = require("file-type");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const allowedExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
]);

const imageUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },

  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP images are allowed"
        )
      );
    }

    const extension = (file.originalname || "")
      .split(".")
      .pop()
      .toLowerCase();

    if (!allowedExtensions.has(extension)) {
      return cb(new Error("Invalid image file extension"));
    }

    cb(null, true);
  },
});

const validateImageContent = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    if (!detectedType) {
      return res.status(400).json({
        success: false,
        message: "Unable to determine actual image type",
      });
    }

    if (!allowedMimeTypes.has(detectedType.mime)) {
      return res.status(400).json({
        success: false,
        message: "Uploaded file is not a valid image",
      });
    }

    if (req.file.mimetype !== detectedType.mime) {
      return res.status(400).json({
        success: false,
        message: "Image type does not match its actual content",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  imageUpload,
  validateImageContent,
};