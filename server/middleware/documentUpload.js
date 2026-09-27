const multer = require("multer");
const { fileTypeFromBuffer } = require("file-type");

const memoryStorage = multer.memoryStorage();

const allowed = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

//improve security
const allowedExtensions = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".doc",
  ".docx"
]);


const documentUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      return cb(
        new Error("Only PDF, images, DOC, DOCX allowed")
      );
    }

    //to fixed issue check the file extension
    const extension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf("."));

    if (!allowedExtensions.has(extension)) {
      return cb(
        new Error("Invalid file extension")
      );
    }
    cb(null, true);
  },
});

//to fixed issue check actual file content after multer recieves it
const validateDocumentContent = async (req, res, next) => {
  try {

    if (!req.file) {
      return next();
    }

    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    if (!detectedType) {
      return res.status(400).json({
        message: "Unable to determine actual file type",
      });
    }

    if (!allowed.has(detectedType.mime)) {
      return res.status(400).json({
        message: "File Content does not match an allowed file type",
      });
    }

    //ensure declare allowed type matches actual content
    if (detectedType.mime !== req.file.mimetype) {
      return res.status(400).json({
        message: "File type does not match its content",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
module.exports = {
  documentUpload,
  validateDocumentContent,
};
