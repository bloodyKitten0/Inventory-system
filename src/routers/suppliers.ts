import express from "express";
const router = express.Router();

import * as suppliersController from "../controllers/suppliers.js";
import authenticate from "../middlewares/auth.js";
import requirePermission from "../middlewares/authorization.js";
import validate from "../middlewares/validate.js";

import {
  create as createValidator,
  update as updateValidator,
  id as idValidator,
} from "../validators/suppliers.js";

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
 *       404:
 *         description: No suppliers found
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
 *           minimum: 1
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier found
 *       400:
 *         description: Invalid supplier ID
 *       404:
 *         description: Supplier not found
 */
router.get(
  "/:id",
  validate(idValidator),
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
 *                 minLength: 2
 *                 example: Tech Supplies Inc
 *               supplier_email:
 *                 type: string
 *                 format: email
 *                 example: supplier@example.com
 *               supplier_phone:
 *                 type: string
 *                 minLength: 3
 *                 example: "+966501234567"
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       400:
 *         description: Invalid supplier data
 *       409:
 *         description: Supplier already exists
 */
router.post(
  "/",
  validate(createValidator),
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
 *           minimum: 1
 *         description: Supplier ID
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
 *                 minLength: 2
 *                 example: Tech Supplies Inc
 *               supplier_email:
 *                 type: string
 *                 format: email
 *                 example: supplier@example.com
 *               supplier_phone:
 *                 type: string
 *                 minLength: 3
 *                 example: "+966501234567"
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       400:
 *         description: Invalid supplier data
 *       404:
 *         description: Supplier not found
 */
router.patch(
  "/:id",
  validate(updateValidator),
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
 *           minimum: 1
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *       400:
 *         description: Invalid supplier ID
 *       404:
 *         description: Supplier not found
 */
router.delete(
  "/:id",
  validate(idValidator),
  requirePermission("supplier.delete"),
  suppliersController.remove,
);

export default router;
