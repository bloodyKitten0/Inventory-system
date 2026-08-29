const express = require("express");
const router = express.Router();

const warehousesController = require("../controllers/warehouses");
const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");
const validate = require("../middlewares/validate.js");

const {
  create: createValidator,
  update: updateValidator,
  id: idValidator,
} = require("../validators/warehouses.js");

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
 *       404:
 *         description: No warehouses found
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
 *           minimum: 1
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse found
 *       400:
 *         description: Invalid warehouse ID
 *       404:
 *         description: Warehouse not found
 */
router.get(
  "/:id",
  validate(idValidator),
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
 *                 minLength: 2
 *                 example: Main Warehouse
 *               location:
 *                 type: string
 *                 minLength: 2
 *                 example: Riyadh
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *       400:
 *         description: Invalid warehouse data
 */
router.post(
  "/",
  validate(createValidator),
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
 *           minimum: 1
 *         description: Warehouse ID
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
 *                 minLength: 2
 *                 example: Main Warehouse
 *               location:
 *                 type: string
 *                 minLength: 2
 *                 example: Jeddah
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *       400:
 *         description: Invalid warehouse data
 *       404:
 *         description: Warehouse not found
 */
router.patch(
  "/:id",
  validate(updateValidator),
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
 *           minimum: 1
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse deleted successfully
 *       400:
 *         description: Invalid warehouse ID
 *       404:
 *         description: Warehouse not found
 */
router.delete(
  "/:id",
  validate(idValidator),
  requirePermission("warehouse.delete"),
  warehousesController.remove,
);

module.exports = router;
