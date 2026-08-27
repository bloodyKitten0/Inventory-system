const express = require("express");

const {
  read,
  readOne,
  productMovements,
  warehouseMovements,
  productWarehouseMovements,
} = require("../controllers/stock-movements");

const router = express.Router();
const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Stock Movements
 *   description: Inventory movement history
 */

/**
 * @swagger
 * /stock-movements:
 *   get:
 *     summary: Get all stock movements
 *     tags: [Stock Movements]
 *     responses:
 *       200:
 *         description: Stock movements
 */
router.get("/stock-movements", requirePermission("stock_movement.read"), read);

/**
 * @swagger
 * /stock-movements/{id}:
 *   get:
 *     summary: Get one stock movement
 *     tags: [Stock Movements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Stock movement ID
 *     responses:
 *       200:
 *         description: Stock movement
 *       404:
 *         description: Stock movement not found
 */
router.get(
  "/stock-movements/:id",
  requirePermission("stock_movement.read"),
  readOne,
);

/**
 * @swagger
 * /stock-movements/product/{id}:
 *   get:
 *     summary: Get movements for a product
 *     tags: [Stock Movements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product stock movements
 *       404:
 *         description: No movements found
 */
router.get(
  "/stock-movements/product/:id",
  requirePermission("stock_movement.read"),
  productMovements,
);

/**
 * @swagger
 * /stock-movements/warehouse/{id}:
 *   get:
 *     summary: Get movements for a warehouse
 *     tags: [Stock Movements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse stock movements
 *       404:
 *         description: No movements found
 */
router.get(
  "/stock-movements/warehouse/:id",
  requirePermission("stock_movement.read"),
  warehouseMovements,
);

/**
 * @swagger
 * /stock-movements/product-details/{id}:
 *   get:
 *     summary: Get product movements with product and warehouse details
 *     tags: [Stock Movements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product movements with related product and warehouse data
 *       404:
 *         description: No movements found
 */
router.get(
  "/stock-movements/product-details/:id",
  requirePermission("stock_movement.read"),
  productWarehouseMovements,
);

module.exports = router;
