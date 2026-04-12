const { validationResult } = require("express-validator");
const {
  listPendingDoctors,
  updateUserStatus,
  createUser: serviceCreateUser,
  getAllUsers: serviceGetAllUsers,
  toggleUserStatus: serviceToggleUserStatus,
  deleteUser: serviceDeleteUser,
  getStats: serviceGetStats,
  getAppointments: serviceGetAppointments,
  createMeetingLink: serviceCreateMeetingLink,
  updateUser: serviceUpdateUser,
  resetUserPassword: serviceResetUserPassword,
  generateReport: serviceGenerateReport,
} = require("../services/adminService");

const getPendingDoctors = async (req, res, next) => {
  try {
    const result = await listPendingDoctors();
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "all";

    // Sanitize pagination values
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100); // cap at 100

    const result = await serviceGetAllUsers(safePage, safeLimit, search, role);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const result = await serviceToggleUserStatus(req.params.id);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting their own account
    if (req.params.id === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        data: { message: "Cannot delete your own admin account" },
      });
    }

    const result = await serviceDeleteUser(req.params.id);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const result = await serviceGetStats();
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const patchUserStatus = async (req, res, next) => {
  try {
    // Validation now handled by adminValidator + validateRequest middleware
    const result = await updateUserStatus({
      userId: req.params.id,
      status: req.body.status,
    });
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const postCreateUser = async (req, res, next) => {
  try {
    // Validation now handled by adminValidator + validateRequest middleware
    const result = await serviceCreateUser(req.body);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const result = await serviceGetAppointments();
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const createMeetingLink = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const result = await serviceCreateMeetingLink(appointmentId);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const putUpdateUser = async (req, res, next) => {
  try {
    const result = await serviceUpdateUser(req.params.id, req.body);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const postResetPassword = async (req, res, next) => {
  try {
    const customPassword = req.body.password || null;
    const result = await serviceResetUserPassword(
      req.params.id,
      customPassword,
    );
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const postGenerateReport = async (req, res, next) => {
  try {
    // Validation now handled by adminValidator + validateRequest middleware
    const { category, fromDate, toDate } = req.body;
    const result = await serviceGenerateReport({ category, fromDate, toDate });
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingDoctors,
  patchUserStatus,
  postCreateUser,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getStats,
  getAppointments,
  createMeetingLink,
  putUpdateUser,
  postResetPassword,
  postGenerateReport,
};
