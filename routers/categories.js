const express = require("express");
const router = express.Router();

const categoriesController = require("../controllers/categories");
const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");

const validate = require("../middlewares/validate.js");

const {
  create: createValidator,
  update: updateValidator,
  id: idValidator,
} = require("../validators/categories.js");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category management
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get("/", requirePermission("category.read"), categoriesController.read);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category found
 *       404:
 *         description: Category not found
 */
router.get(
  "/:id",
  validate(idValidator),
  requirePermission("category.read"),
  categoriesController.readOne,
);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               desc:
 *                 type: string
 *                 example: Electronic products
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post(
  "/",
  validate(createValidator),
  requirePermission("category.create"),
  categoriesController.create,
);

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Update a category
 *     tags: [Categories]
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
 *                 example: Electronics
 *               desc:
 *                 type: string
 *                 example: Updated description
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */
router.patch(
  "/:id",
  validate(updateValidator),
  requirePermission("category.update"),
  categoriesController.update,
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete(
  "/:id",
  validate(idValidator),
  requirePermission("category.delete"),
  categoriesController.remove,
);

module.exports = router;
//
