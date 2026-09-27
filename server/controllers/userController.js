const mongoose = require("mongoose");
const User = require("../models/User");

/*
 * V3 FIX - Missing Authentication + Excessive Data Exposure
 *
 * 1. Routes require a valid JWT (authMiddleware in userRoutes.js).
 * 2. Only an allow-list of non-sensitive fields is returned
 *    (no passwordHash, refreshTokenHash, email or phone).
 * 3. Least privilege on the directory itself:
 *      - admin       -> may list/view any user, optionally filtered by role
 *      - other roles -> may only list/view doctors (needed for booking)
 *                       and their own account
 *    so a patient can no longer enumerate other patients or admins.
 */
const SAFE_USER_FIELDS = "_id role fullName";
const USER_ROLES = ["patient", "doctor", "responder", "admin"];

const isAdmin = (req) => req.user?.role === "admin";

const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;

    // Reject arrays/objects/unknown values (e.g. ?role=a&role=b)
    if (
      role !== undefined &&
      (typeof role !== "string" || !USER_ROLES.includes(role))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role filter",
      });
    }

    let query;
    if (isAdmin(req)) {
      query = role ? { role } : {};
    } else {
      if (role && role !== "doctor") {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }
      query = { role: "doctor" };
    }

    const users = await User.find(query)
      .select(SAFE_USER_FIELDS)
      .sort("fullName");

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const user = await User.findById(req.params.id).select(SAFE_USER_FIELDS);

    const isSelf = user && String(user._id) === String(req.user?.userId);
    const canView = user && (isAdmin(req) || isSelf || user.role === "doctor");

    // 404 (not 403) so the response does not confirm the account exists
    if (!canView) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
};
