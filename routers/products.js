const express = require("express");
const router = express.Router();

const productsController = require("../controllers/products");
const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");

router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Laptop
 *         category_id:
 *           type: integer
 *           example: 2
 *         description:
 *           type: string
 *           example: Business laptop
 *         price:
 *           type: number
 *           format: double
 *           example: 1299.99
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get("/", requirePermission("product.read"), productsController.read);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get one product
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get(
  "/:id",
  requirePermission("product.read"),
  productsController.readOne,
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Product"
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
  "/",
  requirePermission("product.create"),
  productsController.create,
);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Product"
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.patch(
  "/:id",
  requirePermission("product.update"),
  productsController.update,
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete(
  "/:id",
  requirePermission("product.delete"),
  productsController.remove,
);

module.exports = router;
