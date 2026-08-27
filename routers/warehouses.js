const express = require("express");
const router = express.Router();

const warehousesController = require("../controllers/warehouses");
const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: Warehouse management
 */

/**
 * @swagger
 * /warehouses:
 *   get:
 *     summary: Get all warehouses
 *     tags: [Warehouses]
 *     responses:
 *       200:
 *         description: Warehouses retrieved successfully
 */
router.get("/", requirePermission("warehouse.read"), warehousesController.read);

/**
 * @swagger
 * /warehouses/{id}:
 *   get:
 *     summary: Get a warehouse by ID
 *     tags: [Warehouses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Warehouse found
 *       404:
 *         description: Warehouse not found
 */
router.get(
  "/:id",
  requirePermission("warehouse.read"),
  warehousesController.readOne,
);

/**
 * @swagger
 * /warehouses:
 *   post:
 *     summary: Create a warehouse
 *     tags: [Warehouses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 example: Main Warehouse
 *               location:
 *                 type: string
 *                 example: Riyadh
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 */
router.post(
  "/",
  requirePermission("warehouse.create"),
  warehousesController.create,
);

/**
 * @swagger
 * /warehouses/{id}:
 *   patch:
 *     summary: Update a warehouse
 *     tags: [Warehouses]
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
 *               name:
 *                 type: string
 *                 example: Main Warehouse
 *               location:
 *                 type: string
 *                 example: Jeddah
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *       404:
 *         description: Warehouse not found
 */
router.patch(
  "/:id",
  requirePermission("warehouse.update"),
  warehousesController.update,
);

/**
 * @swagger
 * /warehouses/{id}:
 *   delete:
 *     summary: Delete a warehouse
 *     tags: [Warehouses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Warehouse deleted successfully
 *       404:
 *         description: Warehouse not found
 */
router.delete(
  "/:id",
  requirePermission("warehouse.delete"),
  warehousesController.remove,
);

module.exports = router;
