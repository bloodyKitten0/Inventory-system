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
 *         description: Order items
 *       404:
 *         description: No order items found
 */
router.get("/orders-items", read);

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
 *         description: Order item ID
 *     responses:
 *       200:
 *         description: Order item
 *       404:
 *         description: Order item not found
 */
router.get("/orders-items/:id", readOne);

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
 *               - oid
 *               - pid
 *               - quan
 *               - price
 *             properties:
 *               oid:
 *                 type: integer
 *                 description: Order ID
 *               pid:
 *                 type: integer
 *                 description: Product ID
 *               quan:
 *                 type: integer
 *                 description: Quantity ordered
 *               price:
 *                 type: number
 *                 format: double
 *                 description: Price per unit
 *     responses:
 *       201:
 *         description: Order item created
 */
router.post("/orders-items", create);

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
 *         description: Order item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oid:
 *                 type: integer
 *                 description: Order ID
 *               pid:
 *                 type: integer
 *                 description: Product ID
 *               quan:
 *                 type: integer
 *                 description: Quantity ordered
 *               price:
 *                 type: number
 *                 format: double
 *                 description: Price per unit
 *     responses:
 *       200:
 *         description: Order item updated
 *       404:
 *         description: Order item not found
 */
router.put("/orders-items/:id", update);

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
 *         description: Order item ID
 *     responses:
 *       200:
 *         description: Order item deleted
 *       404:
 *         description: Order item not found
 */
router.delete("/orders-items/:id", remove);

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
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order items
 *       404:
 *         description: No items found for this order
 */
router.get("/orders-items/order/:id", orderItems);

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
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Order items containing the product
 *       404:
 *         description: No order items found for this product
 */
router.get("/orders-items/product/:id", productOrderItems);

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
 *         description: Order item ID
 *     responses:
 *       200:
 *         description: Order item with related order and product
 *       404:
 *         description: Order item not found
 */
router.get("/orders-items/details/:id", orderItemDetails);

module.exports = router;
