const express = require("express");
const router = express.Router();

const customersController = require("../controllers/customers");
const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");
const validate = require("../middlewares/validate.js");

const {
  create: createValidator,
  update: updateValidator,
  id: idValidator,
} = require("../validators/customers.js");

router.use(authenticate);

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
router.get("/", requirePermission("customer.read"), customersController.read);

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
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer found
 *       400:
 *         description: Invalid customer ID
 *       404:
 *         description: Customer not found
 */
router.get(
  "/:id",
  validate(idValidator),
  requirePermission("customer.read"),
  customersController.readOne,
);

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
 *               - customer_name
 *               - customer_email
 *               - shipping_address
 *             properties:
 *               customer_name:
 *                 type: string
 *                 example: John Doe
 *               customer_email:
 *                 type: string
 *                 example: customer@example.com
 *               shipping_address:
 *                 type: string
 *                 example: Tokyo, Japan
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Invalid customer data
 */
router.post(
  "/",
  validate(createValidator),
  requirePermission("customer.create"),
  customersController.create,
);

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
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_name
 *               - customer_email
 *               - shipping_address
 *             properties:
 *               customer_name:
 *                 type: string
 *                 example: John Doe
 *               customer_email:
 *                 type: string
 *                 example: customer@example.com
 *               shipping_address:
 *                 type: string
 *                 example: Tokyo, Japan
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       400:
 *         description: Invalid customer data
 *       404:
 *         description: Customer not found
 */
router.patch(
  "/:id",
  validate(updateValidator),
  requirePermission("customer.update"),
  customersController.update,
);

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
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       400:
 *         description: Invalid customer ID
 *       404:
 *         description: Customer not found
 */
router.delete(
  "/:id",
  validate(idValidator),
  requirePermission("customer.delete"),
  customersController.remove,
);

module.exports = router;
