/**
 * ============================================================================
 * TEMPORARY SECURITY TESTING ONLY — MUST BE REMOVED BEFORE PRODUCTION DEPLOYMENT
 * ============================================================================
 *
 * Mounted separately from server/routes/authRoutes.js so it never touches
 * the real authentication route file. Exists only to let Postman exercise
 * the standalone OAuth security-control validators in
 * server/middleware/oauthSecurity.js for evidence-gathering purposes.
 *
 * Delete this file (and its mount point in server.js) before production
 * deployment.
 */

const express = require("express");
const router = express.Router();
const { runOauthSecurityTest } = require("../controllers/oauthSecurityTestController");

// POST /api/auth/oauth/security-test
router.post("/security-test", runOauthSecurityTest);

module.exports = router;
