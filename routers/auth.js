const express = require("express");
const router = express.Router();

const {
  register,
  verifyAccount,
  login,
  logout,
} = require("../security/auth.js");

const validate = require("../middlewares/validate.js");

const {
  register: registerValidator,
  login: loginValidator,
  verifyAccount: verifyAccountValidator,
} = require("../validators/auth.js");

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
 *                 example: John Doe
 *               username:
 *                 type: string
 *                 example: johndoe123
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               shipping_address:
 *                 type: string
 *                 example: 123 Main Street
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Username or email already exists
 */
router.post("/register", validate(registerValidator), register);

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
router.get("/verify", validate(verifyAccountValidator), verifyAccount);

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
 *         description: Invalid email or password input
 *       401:
 *         description: Incorrect email or password
 *       403:
 *         description: Account is not active
 */
router.post("/login", validate(loginValidator), login);

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
//
