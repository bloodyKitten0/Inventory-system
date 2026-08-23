const express = require("express");
const router = express.Router();

const { register, verifyAccount } = require("../security/auth.js");

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

module.exports = router;
