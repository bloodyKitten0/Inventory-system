import express from "express";
const router = express.Router();

import * as productsSupplierController from "../controllers/products-suppliers.js";
import authenticate from "../middlewares/auth.js";
import requirePermission from "../middlewares/authorization.js";
import validate from "../middlewares/validate.js";

import {
  create as createValidator,
  update as updateValidator,
  id as idValidator,
  productId as productIdValidator,
  supplierId as supplierIdValidator,
} from "../validators/product-suppliers.js";

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Products-Suppliers
 *   description: Product and supplier relationships
 */

/**
 * @swagger
 * /products-suppliers:
 *   get:
 *     summary: Get all product-supplier relationships
 *     tags: [Products-Suppliers]
 *     responses:
 *       200:
 *         description: List of product-supplier relationships
 */
router.get(
  "/",
  requirePermission("product_supplier.read"),
  productsSupplierController.read,
);

/**
 * @swagger
 * /products-suppliers/{id}:
 *   get:
 *     summary: Get a product-supplier relationship
 *     tags: [Products-Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Relationship found
 *       404:
 *         description: Relationship not found
 */
router.get(
  "/:id",
  validate(idValidator),
  requirePermission("product_supplier.read"),
  productsSupplierController.readOne,
);

/**
 * @swagger
 * /products-suppliers:
 *   post:
 *     summary: Create a product-supplier relationship
 *     tags: [Products-Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - supplier_id
 *               - supplier_price
 *               - supplier_sku
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               supplier_id:
 *                 type: integer
 *                 example: 2
 *               supplier_price:
 *                 type: number
 *                 example: 150.50
 *               supplier_sku:
 *                 type: string
 *                 example: SKU-1001
 *     responses:
 *       201:
 *         description: Relationship created
 *       400:
 *         description: Invalid input
 */
router.post(
  "/",
  validate(createValidator),
  requirePermission("product_supplier.create"),
  productsSupplierController.create,
);

/**
 * @swagger
 * /products-suppliers/{id}:
 *   patch:
 *     summary: Update a product-supplier relationship
 *     tags: [Products-Suppliers]
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
 *             required:
 *               - product_id
 *               - supplier_id
 *               - supplier_price
 *               - supplier_sku
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               supplier_id:
 *                 type: integer
 *                 example: 2
 *               supplier_price:
 *                 type: number
 *                 example: 150.50
 *               supplier_sku:
 *                 type: string
 *                 example: SKU-1001
 *     responses:
 *       200:
 *         description: Relationship updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Relationship not found
 */
router.patch(
  "/:id",
  validate(updateValidator),
  requirePermission("product_supplier.update"),
  productsSupplierController.update,
);

/**
 * @swagger
 * /products-suppliers/{id}:
 *   delete:
 *     summary: Delete a product-supplier relationship
 *     tags: [Products-Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Relationship deleted
 *       404:
 *         description: Relationship not found
 */
router.delete(
  "/:id",
  validate(idValidator),
  requirePermission("product_supplier.delete"),
  productsSupplierController.remove,
);

/**
 * @swagger
 * /products-suppliers/product/{id}/suppliers:
 *   get:
 *     summary: Get all suppliers for a product
 *     tags: [Products-Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of suppliers for the product
 *       404:
 *         description: No suppliers found
 */
router.get(
  "/product/:id/suppliers",
  validate(productIdValidator),
  requirePermission("product_supplier.read"),
  productsSupplierController.productsSupplier,
);

/**
 * @swagger
 * /products-suppliers/supplier/{id}/products:
 *   get:
 *     summary: Get all products for a supplier
 *     tags: [Products-Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of products supplied by a supplier
 *       404:
 *         description: No products found
 */
router.get(
  "/supplier/:id/products",
  validate(supplierIdValidator),
  requirePermission("product_supplier.read"),
  productsSupplierController.supplierProducts,
);

export default router;
