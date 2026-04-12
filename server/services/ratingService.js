const Rating = require("../models/Rating");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const createRating = async ({ appointmentId, patientId, rating, review }) => {
  // Verify appointment exists and is completed
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.statusCode = 404;
    throw err;
  }
  if (appointment.status !== "completed") {
    const err = new Error("Can only rate completed appointments");
    err.statusCode = 400;
    throw err;
  }
  if (appointment.patient.toString() !== patientId.toString()) {
    const err = new Error("You can only rate your own appointments");
    err.statusCode = 403;
    throw err;
  }

  // Create rating — unique index on appointmentId prevents duplicates
  const newRating = await Rating.create({
    doctorId: appointment.doctor, // This is the User ObjectId, used to find Doctor via userId
    patientId,
    appointmentId,
    rating,
    review: review || "",
  });

  // Recalculate doctor's average rating
  const doctorUserId = appointment.doctor;
  const allRatings = await Rating.find({ doctorId: doctorUserId });
  const totalRatings = allRatings.length;
  const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

  await Doctor.findOneAndUpdate(
    { userId: doctorUserId },
    { rating: Math.round(avgRating * 10) / 10, totalRatings }
  );

  return newRating;
};

const getRatingByAppointment = async (appointmentId) => {
  const rating = await Rating.findOne({ appointmentId });
  return rating;
};

module.exports = { createRating, getRatingByAppointment };
