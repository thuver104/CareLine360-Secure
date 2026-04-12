const ratingService = require("../services/ratingService");

const submitRating = async (req, res, next) => {
  try {
    const rating = await ratingService.createRating({
      appointmentId: req.params.id,
      patientId: req.user.userId,
      rating: req.body.rating,
      review: req.body.review,
    });
    res.status(201).json({ success: true, data: rating });
  } catch (error) {
    next(error);
  }
};

const getAppointmentRating = async (req, res, next) => {
  try {
    const rating = await ratingService.getRatingByAppointment(req.params.id);
    res.json({ success: true, data: rating });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitRating, getAppointmentRating };
