const express = require("express");
const router = express.Router();

const { getUsers, getUserById } = require("../controllers/userController");

const { authMiddleware } = require("../middleware/auth");

/*
 * V3 FIX - Missing Authentication
 *
 * Generic user-directory endpoints must only be available
 * to authenticated CareLine360 users.
 */
router.use(authMiddleware);

router.get("/", getUsers);
router.get("/:id", getUserById);

module.exports = router;
