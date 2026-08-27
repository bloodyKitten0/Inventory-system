const express = require("express");
const router = express.Router();

const suppliersController = require("../controllers/suppliers");
const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Suppliers]
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
 */
router.get("/", requirePermission("supplier.read"), suppliersController.read);

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Get a supplier by ID
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Supplier found
 *       404:
 *         description: Supplier not found
 */
router.get(
  "/:id",
  requirePermission("supplier.read"),
  suppliersController.readOne,
);

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: Create a supplier
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplier_name
 *               - supplier_email
 *               - supplier_phone
 *             properties:
 *               supplier_name:
 *                 type: string
 *                 example: Tech Supplies Inc
 *               supplier_email:
 *                 type: string
 *                 example: supplier@example.com
 *               supplier_phone:
 *                 type: string
 *                 example: "+966501234567"
 *     responses:
 *       201:
 *         description: Supplier created successfully
 */
router.post(
  "/",
  requirePermission("supplier.create"),
  suppliersController.create,
);

/**
 * @swagger
 * /suppliers/{id}:
 *   patch:
 *     summary: Update a supplier
 *     tags: [Suppliers]
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
 *               supplier_name:
 *                 type: string
 *                 example: Tech Supplies Inc
 *               supplier_email:
 *                 type: string
 *                 example: supplier@example.com
 *               supplier_phone:
 *                 type: string
 *                 example: "+966501234567"
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       404:
 *         description: Supplier not found
 */
router.patch(
  "/:id",
  requirePermission("supplier.update"),
  suppliersController.update,
);

/**
 * @swagger
 * /suppliers/{id}:
 *   delete:
 *     summary: Delete a supplier
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *       404:
 *         description: Supplier not found
 */
router.delete(
  "/:id",
  requirePermission("supplier.delete"),
  suppliersController.remove,
);

module.exports = router;
