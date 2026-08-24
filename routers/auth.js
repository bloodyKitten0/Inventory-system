const express = require("express");
const router = express.Router();

const {
  register,
  verifyAccount,
  login,
  logout,
} = require("../security/auth.js");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_name
 *               - username
 *               - email
 *               - password
 *               - shipping_address
 *             properties:
 *               customer_name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               shipping_address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Missing required field
 *       409:
 *         description: Username or email already exists
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify an account
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Account verification token
 *     responses:
 *       200:
 *         description: Account verified successfully
 *       400:
 *         description: Invalid, missing, or expired verification token
 */
router.get("/verify", verifyAccount);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log into an account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Account logged in successfully
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Incorrect email or password
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out of the current account
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Account logged out successfully
 *       401:
 *         description: User is not logged in
 */
router.post("/logout", logout);

module.exports = router;
