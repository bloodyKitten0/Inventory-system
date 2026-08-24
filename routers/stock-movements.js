const express = require("express");

const {
  read,
  readOne,
  create,
  remove,
  productMovements,
  warehouseMovements,
  productWarehouseMovements,
} = require("../controllers/stock-movements");

const router = express.Router();
const authenticate = require("../middlewares/auth.js");

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
router.get("/stock-movements", read);

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
router.get("/stock-movements/:id", readOne);

/**
 * @swagger
 * /stock-movements:
 *   post:
 *     summary: Create a stock movement
 *     tags: [Stock Movements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pid
 *               - wid
 *               - movementType
 *               - quantity
 *             properties:
 *               pid:
 *                 type: integer
 *                 description: Product ID
 *               wid:
 *                 type: integer
 *                 description: Warehouse ID
 *               movementType:
 *                 type: string
 *                 description: Type of stock movement
 *                 example: SALE
 *               quantity:
 *                 type: integer
 *                 description: Quantity involved in the movement
 *                 example: 5
 *     responses:
 *       201:
 *         description: Stock movement created
 */
router.post("/stock-movements", create);

/**
 * @swagger
 * /stock-movements/{id}:
 *   delete:
 *     summary: Delete a stock movement
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
 *         description: Stock movement deleted
 *       404:
 *         description: Stock movement not found
 */
router.delete("/stock-movements/:id", remove);

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
router.get("/stock-movements/product/:id", productMovements);

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
router.get("/stock-movements/warehouse/:id", warehouseMovements);

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
router.get("/stock-movements/product-details/:id", productWarehouseMovements);

module.exports = router;
