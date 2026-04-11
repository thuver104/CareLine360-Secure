jest.mock("../../../config/cloudinary", () => ({
  uploader: {
    upload_stream: jest.fn((opts, cb) => {
      const stream = require("stream");
      const writable = new stream.Writable({
        write(chunk, enc, next) { next(); },
      });
      writable.on("finish", () => {
        cb(null, { secure_url: "https://cloudinary.com/test.pdf", public_id: "test_id" });
      });
      return writable;
    }),
  },
}));

const { generateReceiptBuffer, uploadReceiptBuffer } = require("../../../services/receiptPdfService");

describe("Receipt PDF Service", () => {
  describe("generateReceiptBuffer", () => {
    it("should generate a PDF buffer", async () => {
      const buffer = await generateReceiptBuffer({
        patient: { fullName: "John Doe", email: "john@test.com" },
        appointment: {
          date: new Date("2026-04-15"),
          time: "10:00",
          consultationType: "video",
        },
        payment: {
          amount: 50,
          currency: "USD",
          method: "card",
          status: "verified",
          transactionRef: "TXN-123",
          verifiedAt: new Date(),
        },
        doctor: { fullName: "Dr. Smith", specialization: "Cardiology" },
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      // PDF files start with %PDF
      expect(buffer.toString("utf8", 0, 4)).toBe("%PDF");
    });
  });

  describe("uploadReceiptBuffer", () => {
    it("should upload buffer and return fileUrl and publicId", async () => {
      const mockBuffer = Buffer.from("fake-pdf-content");
      const result = await uploadReceiptBuffer(mockBuffer);

      expect(result).toHaveProperty("fileUrl");
      expect(result).toHaveProperty("publicId");
      expect(result.fileUrl).toContain("cloudinary.com");
    });
  });
});
