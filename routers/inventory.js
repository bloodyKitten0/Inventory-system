const express = require("express");

const {
  read,
  readOne,
  create,
  update,
  remove,
  productInventory,
  warehouseInventory,
  adjustStock,
  lowStock,
  inventorySummary,
  inventorySummaryOne,
  checkAvailability,
} = require("../controllers/inventory");

const router = express.Router();
const authenticate = require("../middlewares/auth.js");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory records
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Inventory records
 *       404:
 *         description: No inventory found
 */
router.get("/inventory", read);

/**
 * @swagger
 * /inventory/product/{id}:
 *   get:
 *     summary: Get inventory for a product across warehouses
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product inventory
 *       404:
 *         description: Product inventory not found
 */
router.get("/inventory/product/:id", productInventory);

/**
 * @swagger
 * /inventory/warehouse/{id}:
 *   get:
 *     summary: Get inventory for a warehouse
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse inventory
 *       404:
 *         description: Warehouse inventory not found
 */
router.get("/inventory/warehouse/:id", warehouseInventory);

/**
 * @swagger
 * /inventory/low-stock/{below}:
 *   get:
 *     summary: Find products below a stock threshold
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: below
 *         required: true
 *         schema:
 *           type: integer
 *         description: Stock threshold
 *     responses:
 *       200:
 *         description: Products below the threshold
 *       404:
 *         description: No products below the threshold
 */
router.get("/inventory/low-stock/:below", lowStock);

/**
 * @swagger
 * /inventory/summary:
 *   get:
 *     summary: Get total inventory for every product
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Inventory summary
 *       404:
 *         description: Inventory is empty
 */
router.get("/inventory/summary", inventorySummary);

/**
 * @swagger
 * /inventory/summary/{id}:
 *   get:
 *     summary: Get total inventory for one product
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product inventory summary
 *       404:
 *         description: Inventory is empty
 */
router.get("/inventory/summary/:id", inventorySummaryOne);

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Get one inventory record
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory ID
 *     responses:
 *       200:
 *         description: Inventory record
 *       404:
 *         description: Inventory not found
 */
router.get("/inventory/:id", readOne);

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create an inventory record
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pid
 *               - wid
 *               - amo
 *             properties:
 *               pid:
 *                 type: integer
 *                 description: Product ID
 *               wid:
 *                 type: integer
 *                 description: Warehouse ID
 *               amo:
 *                 type: integer
 *                 description: Initial stock amount
 *     responses:
 *       201:
 *         description: Inventory created
 */
router.post("/inventory", create);

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Update an inventory record
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pid:
 *                 type: integer
 *               wid:
 *                 type: integer
 *               amo:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Inventory updated
 *       404:
 *         description: Inventory not found
 */
router.put("/inventory/:id", update);

/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     summary: Delete an inventory record
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory deleted
 *       404:
 *         description: Inventory not found
 */
router.delete("/inventory/:id", remove);

/**
 * @swagger
 * /inventory/{id}/adjust:
 *   patch:
 *     summary: Adjust inventory stock
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - change
 *             properties:
 *               change:
 *                 type: integer
 *                 description: Amount to add or remove. Use a negative number to remove stock.
 *                 example: -5
 *     responses:
 *       200:
 *         description: Stock adjusted
 *       400:
 *         description: Not enough stock
 *       404:
 *         description: Inventory not found
 */
router.patch("/inventory/:id/adjust", adjustStock);

/**
 * @swagger
 * /inventory/check-availability:
 *   post:
 *     summary: Check stock availability in a warehouse
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - pid
 *               - wid
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Requested quantity
 *                 example: 10
 *               pid:
 *                 type: integer
 *                 description: Product ID
 *                 example: 1
 *               wid:
 *                 type: integer
 *                 description: Warehouse ID
 *                 example: 2
 *     responses:
 *       200:
 *         description: Availability result
 *       404:
 *         description: Inventory not found
 */
router.post("/inventory/check-availability", checkAvailability);

module.exports = router;
