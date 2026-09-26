const User = require("../models/User");

/*
 * Only fields required by the generic user-directory
 * functionality are returned.
 *
 * Authentication-sensitive and private account fields such as
 * passwordHash, refreshTokenHash, email and phone are excluded
 * by default because they are not part of this allow-list.
 */
const SAFE_USER_FIELDS = "_id role fullName";

const getUsers = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.role) {
      query.role = req.query.role;
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
    const user = await User.findById(req.params.id).select(SAFE_USER_FIELDS);

    if (!user) {
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
