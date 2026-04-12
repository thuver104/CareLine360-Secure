const mongoose = require("mongoose");

jest.mock("../../../models/Rating");
jest.mock("../../../models/Doctor");
jest.mock("../../../models/Appointment");

const Rating = require("../../../models/Rating");
const Doctor = require("../../../models/Doctor");
const Appointment = require("../../../models/Appointment");
const ratingService = require("../../../services/ratingService");

describe("Rating Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createRating", () => {
    const patientId = new mongoose.Types.ObjectId().toString();
    const doctorUserId = new mongoose.Types.ObjectId();
    const appointmentId = new mongoose.Types.ObjectId().toString();

    const mockAppointment = {
      _id: appointmentId,
      patient: patientId,
      doctor: doctorUserId,
      status: "completed",
    };

    it("should create a rating for a completed appointment", async () => {
      Appointment.findById.mockResolvedValue(mockAppointment);

      const mockCreated = {
        _id: new mongoose.Types.ObjectId(),
        doctorId: doctorUserId,
        patientId,
        appointmentId,
        rating: 5,
        review: "Great doctor",
      };
      Rating.create.mockResolvedValue(mockCreated);
      Rating.find.mockResolvedValue([mockCreated]);
      Doctor.findOneAndUpdate.mockResolvedValue({});

      const result = await ratingService.createRating({
        appointmentId,
        patientId,
        rating: 5,
        review: "Great doctor",
      });

      expect(result).toBeDefined();
      expect(result.rating).toBe(5);
      expect(Rating.create).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 5, review: "Great doctor" })
      );
      expect(Doctor.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: doctorUserId },
        expect.objectContaining({ rating: 5, totalRatings: 1 })
      );
    });

    it("should reject rating for a non-completed appointment", async () => {
      Appointment.findById.mockResolvedValue({ ...mockAppointment, status: "pending" });

      await expect(
        ratingService.createRating({ appointmentId, patientId, rating: 4 })
      ).rejects.toThrow("Can only rate completed appointments");
    });

    it("should reject if patient does not match appointment", async () => {
      const wrongPatient = new mongoose.Types.ObjectId().toString();
      Appointment.findById.mockResolvedValue(mockAppointment);

      await expect(
        ratingService.createRating({ appointmentId, patientId: wrongPatient, rating: 4 })
      ).rejects.toThrow("You can only rate your own appointments");
    });

    it("should reject if appointment not found", async () => {
      Appointment.findById.mockResolvedValue(null);

      await expect(
        ratingService.createRating({ appointmentId, patientId, rating: 4 })
      ).rejects.toThrow("Appointment not found");
    });
  });

  describe("getRatingByAppointment", () => {
    it("should return rating when it exists", async () => {
      const mockRating = { rating: 4, review: "Good" };
      Rating.findOne.mockResolvedValue(mockRating);

      const result = await ratingService.getRatingByAppointment("someId");
      expect(result).toEqual(mockRating);
      expect(Rating.findOne).toHaveBeenCalledWith({ appointmentId: "someId" });
    });

    it("should return null when no rating exists", async () => {
      Rating.findOne.mockResolvedValue(null);

      const result = await ratingService.getRatingByAppointment("someId");
      expect(result).toBeNull();
    });
  });
});
