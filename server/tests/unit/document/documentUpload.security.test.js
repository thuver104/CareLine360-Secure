const { validateDocumentContent } = require("../../../middleware/documentUpload");

describe("V8 - Insecure File Upload Security Tests", () => {
    const runMiddleware = async (file) => {
        const req = { file };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        await validateDocumentContent(req, res, next);

        return { req, res, next };
    };

    test("should reject a fake PDF containing plain text", async () => {
        const fakePdf = {
            originalname: "fake.pdf",
            mimetype: "application/pdf",
            buffer: Buffer.from(
                "This is only plain text and is NOT a real PDF file."
            ),
        };

        const { res, next } = await runMiddleware(fakePdf);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            message: "Unable to determine actual file type",
        });

        expect(next).not.toHaveBeenCalled();
    });

    test("should reject a PNG file declared as PDF", async () => {
        // PNG signature
        const pngContent = Buffer.from([
            0x89,
            0x50,
            0x4e,
            0x47,
            0x0d,
            0x0a,
            0x1a,
            0x0a,

            // Additional PNG bytes
            0x00,
            0x00,
            0x00,
            0x0d,
            0x49,
            0x48,
            0x44,
            0x52,
        ]);

        const spoofedFile = {
            originalname: "fake.pdf",
            mimetype: "application/pdf",
            buffer: pngContent,
        };

        const { res, next } = await runMiddleware(spoofedFile);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            message: "File type does not match its content",
        });

        expect(next).not.toHaveBeenCalled();
    });

    test("should allow a genuine PDF when MIME type matches its content", async () => {
        /*
         * Use a sufficiently complete PDF structure
         * rather than only "%PDF-1.4".
         */
        const realPdfContent = Buffer.from(
            `%PDF-1.4
                1 0 obj
                <<
                /Type /Catalog
                /Pages 2 0 R
                >>
                endobj

                2 0 obj
                <<
                /Type /Pages
                /Count 0
                /Kids []
                >>
                endobj

                xref
                0 3
                0000000000 65535 f
                0000000009 00000 n
                0000000074 00000 n

                trailer
                <<
                /Size 3
                /Root 1 0 R
                >>
                startxref
                129
                %%EOF`
        );

        const genuinePdf = {
            originalname: "document.pdf",
            mimetype: "application/pdf",
            buffer: realPdfContent,
        };

        const { res, next } = await runMiddleware(genuinePdf);

        expect(next).toHaveBeenCalledWith();

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});