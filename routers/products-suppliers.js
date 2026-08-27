const express = require("express");
const router = express.Router();

const productsSupplierController = require("../controllers/products-suppliers");
const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");

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
 *               - pid
 *               - sid
 *               - spr
 *               - sku
 *             properties:
 *               pid:
 *                 type: integer
 *                 example: 1
 *               sid:
 *                 type: integer
 *                 example: 2
 *               spr:
 *                 type: number
 *                 example: 150.50
 *               sku:
 *                 type: string
 *                 example: "SUP-ABC-001"
 *     responses:
 *       201:
 *         description: Relationship created
 */
router.post(
  "/",
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
 *             properties:
 *               pid:
 *                 type: integer
 *               sid:
 *                 type: integer
 *               spr:
 *                 type: number
 *               sku:
 *                 type: string
 *     responses:
 *       200:
 *         description: Relationship updated
 *       404:
 *         description: Relationship not found
 */
router.patch(
  "/:id",
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
  requirePermission("product_supplier.read"),
  productsSupplierController.supplierProducts,
);

module.exports = router;
