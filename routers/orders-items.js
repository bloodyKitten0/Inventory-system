const express = require("express");

const {
  read,
  readOne,
  create,
  update,
  remove,
  orderItems,
  productOrderItems,
  orderItemDetails,
} = require("../controllers/orders-items");

const router = express.Router();

const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");
const validate = require("../middlewares/validate.js");

const {
  create: createValidator,
  update: updateValidator,
  id: idValidator,
} = require("../validators/order-items.js");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Order Items
 *   description: Order item management
 */

/**
 * @swagger
 * /orders-items:
 *   get:
 *     summary: Get all order items
 *     tags: [Order Items]
 *     responses:
 *       200:
 *         description: Order items retrieved successfully
 *       404:
 *         description: No order items found
 */
router.get("/orders-items", requirePermission("order_item.read"), read);

/**
 * @swagger
 * /orders-items/{id}:
 *   get:
 *     summary: Get one order item
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order item ID
 *     responses:
 *       200:
 *         description: Order item found
 *       400:
 *         description: Invalid order item ID
 *       404:
 *         description: Order item not found
 */
router.get(
  "/orders-items/:id",
  validate(idValidator),
  requirePermission("order_item.read"),
  readOne,
);

/**
 * @swagger
 * /orders-items:
 *   post:
 *     summary: Create an order item
 *     tags: [Order Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - product_id
 *               - quantity
 *               - price
 *             properties:
 *               order_id:
 *                 type: integer
 *                 example: 1
 *               product_id:
 *                 type: integer
 *                 example: 5
 *               quantity:
 *                 type: integer
 *                 example: 3
 *               price:
 *                 type: number
 *                 format: double
 *                 example: 29.99
 *     responses:
 *       201:
 *         description: Order item created successfully
 *       400:
 *         description: Invalid order item data
 */
router.post(
  "/orders-items",
  validate(createValidator),
  requirePermission("order_item.create"),
  create,
);

/**
 * @swagger
 * /orders-items/{id}:
 *   put:
 *     summary: Update an order item
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - price
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 5
 *               price:
 *                 type: number
 *                 format: double
 *                 example: 24.99
 *     responses:
 *       200:
 *         description: Order item updated successfully
 *       400:
 *         description: Invalid order item data
 *       404:
 *         description: Order item not found
 */
router.put(
  "/orders-items/:id",
  validate(updateValidator),
  requirePermission("order_item.update"),
  update,
);

/**
 * @swagger
 * /orders-items/{id}:
 *   delete:
 *     summary: Delete an order item
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order item ID
 *     responses:
 *       200:
 *         description: Order item deleted successfully
 *       400:
 *         description: Invalid order item ID
 *       404:
 *         description: Order item not found
 */
router.delete(
  "/orders-items/:id",
  validate(idValidator),
  requirePermission("order_item.delete"),
  remove,
);

/**
 * @swagger
 * /orders-items/order/{id}:
 *   get:
 *     summary: Get all items belonging to an order
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order items retrieved successfully
 *       400:
 *         description: Invalid order ID
 *       404:
 *         description: No items found for this order
 */
router.get(
  "/orders-items/order/:id",
  validate(idValidator),
  requirePermission("order_item.read"),
  orderItems,
);

/**
 * @swagger
 * /orders-items/product/{id}:
 *   get:
 *     summary: Get all order items containing a product
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Order items containing the product
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: No order items found for this product
 */
router.get(
  "/orders-items/product/:id",
  validate(idValidator),
  requirePermission("order_item.read"),
  productOrderItems,
);

/**
 * @swagger
 * /orders-items/details/{id}:
 *   get:
 *     summary: Get an order item with its order and product details
 *     tags: [Order Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Order item ID
 *     responses:
 *       200:
 *         description: Order item with related order and product
 *       400:
 *         description: Invalid order item ID
 *       404:
 *         description: Order item not found
 */
router.get(
  "/orders-items/details/:id",
  validate(idValidator),
  requirePermission("order_item.read"),
  orderItemDetails,
);

module.exports = router;
//
