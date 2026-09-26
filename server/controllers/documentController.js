const Document = require("../models/Document");
const Patient = require("../models/Patient");
const cloudinary = require("../config/cloudinary");

// always open the secure_url we saved
const buildViewUrl = (doc) => doc.fileUrl;



const uploadBufferToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "careline360/documents",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

const uploadMyDocument = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log("UPLOAD req.file:", req.file);

    if (!req.file?.buffer) {
      return res.status(400).json({
        message: "No document uploaded",
      });
    }

    const { title = "", category = "other" } = req.body;

    const patient = await Patient.findOne({
      userId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
      ],
    });

    // Upload to Cloudinary ONLY after validation middleware
    const cloudinaryResult = await uploadBufferToCloudinary(
      req.file.buffer
    );

    if (!cloudinaryResult?.public_id || !cloudinaryResult?.secure_url) {
      return res.status(500).json({
        message: "Cloudinary upload failed",
      });
    }

    const doc = await Document.create({
      userId,
      patientId: patient?._id || null,

      title,
      category,

      fileName: req.file.originalname || "",
      fileUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,

      mimeType: req.file.mimetype || "",
      fileSize: req.file.size || 0,

      resourceType: cloudinaryResult.resource_type || "auto",
      format: cloudinaryResult.format || "",
      version: cloudinaryResult.version || 0,
    });

    return res.status(201).json({
      message: "Document uploaded",
      document: {
        ...doc.toObject(),
        viewUrl: buildViewUrl(doc),
      },
    });
  } catch (e) {
    console.error("UPLOAD DOC ERROR:", e);

    return res.status(500).json({
      message: e.message || "Server error",
    });
  }
};


const listMyDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, q } = req.query;

    const filter = { userId, isDeleted: false };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (q && q.trim()) {
      const kw = q.trim();
      filter.$or = [
        { title: { $regex: kw, $options: "i" } },
        { fileName: { $regex: kw, $options: "i" } },
      ];
    }

    const docs = await Document.find(filter).sort({ createdAt: -1 });

    return res.json({
      documents: docs.map((d) => ({
        ...d.toObject(),
        viewUrl: d.fileUrl,
      })),
    });
  } catch (e) {
    console.error("LIST DOC ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteMyDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const doc = await Document.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Document not found" });

    return res.json({ message: "Document deleted (hidden)" });
  } catch (e) {
    console.error("DELETE DOC ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteMyDocumentPermanent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // ✅ allow permanent delete even if already hidden
    const doc = await Document.findOne({ _id: id, userId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const rtype =
      doc.resourceType === "image" ? "image" :
        doc.resourceType === "video" ? "video" :
          "raw";

    const result = await cloudinary.uploader.destroy(doc.publicId, { resource_type: rtype });
    console.log("Cloudinary destroy result:", result);

    // mark deleted in DB
    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await doc.save();

    return res.json({ message: "Document deleted permanently" });
  } catch (e) {
    console.error("PERMANENT DELETE ERROR:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

module.exports = {
  uploadMyDocument,
  listMyDocuments,
  deleteMyDocument,
  deleteMyDocumentPermanent,
};
