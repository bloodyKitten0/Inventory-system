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
const requirePermission = require("../middlewares/authorization.js");
const validate = require("../middlewares/validate.js");

const inventoryValidation = require("../validators/inventory.js");

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
 *         description: Inventory records retrieved successfully
 *       404:
 *         description: No inventory found
 */
router.get("/inventory", requirePermission("inventory.read"), read);

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
 *           minimum: 1
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product inventory retrieved successfully
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product inventory not found
 */
router.get(
  "/inventory/product/:id",
  validate(inventoryValidation.id),
  requirePermission("inventory.read"),
  productInventory,
);

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
 *           minimum: 1
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse inventory retrieved successfully
 *       400:
 *         description: Invalid warehouse ID
 *       404:
 *         description: Warehouse inventory not found
 */
router.get(
  "/inventory/warehouse/:id",
  validate(inventoryValidation.id),
  requirePermission("inventory.read"),
  warehouseInventory,
);

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
 *           type: number
 *           minimum: 0
 *         description: Stock threshold
 *     responses:
 *       200:
 *         description: Products below the threshold
 *       400:
 *         description: Invalid stock threshold
 */
router.get(
  "/inventory/low-stock/:below",
  validate(inventoryValidation.lowStock),
  requirePermission("inventory.low_stock"),
  lowStock,
);

/**
 * @swagger
 * /inventory/summary:
 *   get:
 *     summary: Get total inventory for every product
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Inventory summary retrieved successfully
 *       404:
 *         description: Inventory is empty
 */
router.get(
  "/inventory/summary",
  requirePermission("inventory.summary"),
  inventorySummary,
);

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
 *           minimum: 1
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product inventory summary retrieved successfully
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Inventory is empty
 */
router.get(
  "/inventory/summary/:id",
  validate(inventoryValidation.id),
  requirePermission("inventory.summary"),
  inventorySummaryOne,
);

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
 *           minimum: 1
 *         description: Inventory ID
 *     responses:
 *       200:
 *         description: Inventory record retrieved successfully
 *       400:
 *         description: Invalid inventory ID
 *       404:
 *         description: Inventory not found
 */
router.get(
  "/inventory/:id",
  validate(inventoryValidation.id),
  requirePermission("inventory.read"),
  readOne,
);

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
 *               - product_id
 *               - warehouse_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *               warehouse_id:
 *                 type: integer
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Inventory created successfully
 *       400:
 *         description: Invalid inventory data
 */
router.post(
  "/inventory",
  validate(inventoryValidation.create),
  requirePermission("inventory.create"),
  create,
);

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
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       400:
 *         description: Invalid inventory data
 *       404:
 *         description: Inventory not found
 */
router.put(
  "/inventory/:id",
  validate(inventoryValidation.update),
  requirePermission("inventory.update"),
  update,
);

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
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Inventory deleted successfully
 *       400:
 *         description: Invalid inventory ID
 *       404:
 *         description: Inventory not found
 */
router.delete(
  "/inventory/:id",
  validate(inventoryValidation.id),
  requirePermission("inventory.delete"),
  remove,
);

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
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: -5
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *       400:
 *         description: Invalid adjustment or not enough stock
 *       404:
 *         description: Inventory not found
 */
router.patch(
  "/inventory/:id/adjust",
  validate(inventoryValidation.adjust),
  requirePermission("inventory.adjust"),
  adjustStock,
);

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
 *               pid:
 *                 type: integer
 *               wid:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Availability result
 *       400:
 *         description: Invalid availability request
 *       404:
 *         description: Inventory not found
 */
router.post(
  "/inventory/check-availability",
  validate(inventoryValidation.checkAvailability),
  requirePermission("inventory.checks"),
  checkAvailability,
);

module.exports = router;
//
