const express = require("express");
const router = express.Router();

const productsController = require("../controllers/products");
const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");
const validate = require("../middlewares/validate.js");

const {
  create: createValidator,
  update: updateValidator,
  id: idValidator,
} = require("../validators/products.js");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductCreate:
 *       type: object
 *       required:
 *         - name
 *         - category_id
 *         - price
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           example: Laptop
 *         category_id:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         description:
 *           type: string
 *           example: Business laptop
 *         price:
 *           type: number
 *           minimum: 0
 *           example: 1299.99
 *
 *     ProductUpdate:
 *       type: object
 *       required:
 *         - name
 *         - category_id
 *         - price
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           example: Laptop
 *         category_id:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         description:
 *           type: string
 *           example: Business laptop
 *         price:
 *           type: number
 *           minimum: 0
 *           example: 1299.99
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
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
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 */
router.get(
  "/:id",
  validate(idValidator),
  requirePermission("product.read"),
  productsController.readOne,
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ProductCreate"
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid product data
 */
router.post(
  "/",
  validate(createValidator),
  requirePermission("product.create"),
  productsController.create,
);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ProductUpdate"
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid product data
 *       404:
 *         description: Product not found
 */
router.patch(
  "/:id",
  validate(updateValidator),
  requirePermission("product.update"),
  productsController.update,
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 */
router.delete(
  "/:id",
  validate(idValidator),
  requirePermission("product.delete"),
  productsController.remove,
);

module.exports = router;
//
