const express = require("express");
const router = express.Router();

const customersController = require("../controllers/customers");

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 */
router.get("/", customersController.read);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get a customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer found
 *       404:
 *         description: Customer not found
 */
router.get("/:id", customersController.readOne);

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_email
 *               - customer_address
 *             properties:
 *               customer_email:
 *                 type: string
 *                 example: customer@example.com
 *               customer_address:
 *                 type: string
 *                 example: Riyadh, Saudi Arabia
 *     responses:
 *       201:
 *         description: Customer created successfully
 */
router.post("/", customersController.create);

/**
 * @swagger
 * /customers/{id}:
 *   patch:
 *     summary: Update a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer_email:
 *                 type: string
 *                 example: customer@example.com
 *               customer_address:
 *                 type: string
 *                 example: Riyadh, Saudi Arabia
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
router.patch("/:id", customersController.update);

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
router.delete("/:id", customersController.remove);

module.exports = router;
