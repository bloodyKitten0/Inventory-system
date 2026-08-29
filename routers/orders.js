const express = require("express");

const {
  read,
  readOne,
  create,
  update,
  remove,
  customerOrders,
  warehouseOrders,
  updateStatus,
  cancelOrder,
  orderDetails,
  calculateOrderTotal,
  processOrder,
} = require("../controllers/orders");

const router = express.Router();

const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");
const validate = require("../middlewares/validate.js");

const {
  create: createValidator,
  id: idValidator,
  customerId: customerIdValidator,
} = require("../validators/orders.js");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       404:
 *         description: No orders found
 */
router.get("/", requirePermission("order.read"), read);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create an order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - warehouse_id
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 description: Customer ID
 *                 example: 1
 *               warehouse_id:
 *                 type: integer
 *                 description: Warehouse ID
 *                 example: 1
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  "/",
  validate(createValidator),
  requirePermission("order.create"),
  create,
);

/**
 * @swagger
 * /orders/customer/{id}:
 *   get:
 *     summary: Get orders belonging to a customer
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer orders
 *       404:
 *         description: No orders found
 */
router.get(
  "/customer/:id",
  validate(customerIdValidator),
  requirePermission("order.read"),
  customerOrders,
);

/**
 * @swagger
 * /orders/warehouse/{id}:
 *   get:
 *     summary: Get orders belonging to a warehouse
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse orders
 *       404:
 *         description: No orders found
 */
router.get(
  "/warehouse/:id",
  validate(idValidator),
  requirePermission("order.read"),
  warehouseOrders,
);

/**
 * @swagger
 * /orders/{id}/details:
 *   get:
 *     summary: Get complete order details including products and order items
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get(
  "/:id/details",
  validate(idValidator),
  requirePermission("order.details"),
  orderDetails,
);

/**
 * @swagger
 * /orders/{id}/total:
 *   get:
 *     summary: Calculate the total price of an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order total
 *       404:
 *         description: Order not found
 */
router.get(
  "/:id/total",
  validate(idValidator),
  requirePermission("order.total"),
  calculateOrderTotal,
);

/**
 * @swagger
 * /orders/{id}/process:
 *   post:
 *     summary: Process an order and deduct inventory
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order processed successfully
 *       400:
 *         description: Order cannot be processed or insufficient stock
 *       404:
 *         description: Order not found
 */
router.post(
  "/:id/process",
  validate(idValidator),
  requirePermission("order.process"),
  processOrder,
);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update an order's status
 *     tags: [Orders]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Order status updated
 *       404:
 *         description: Order not found
 */
router.patch(
  "/:id/status",
  validate(idValidator),
  requirePermission("order.update_status"),
  updateStatus,
);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found or cannot be cancelled
 */
router.patch(
  "/:id/cancel",
  validate(idValidator),
  requirePermission("order.cancel"),
  cancelOrder,
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get one order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get(
  "/:id",
  validate(idValidator),
  requirePermission("order.read"),
  readOne,
);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update an order
 *     tags: [Orders]
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
 *               - customer_id
 *               - warehouse_id
 *             properties:
 *               customer_id:
 *                 type: integer
 *               warehouse_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put(
  "/:id",
  validate(idValidator),
  validate(createValidator),
  requirePermission("order.update"),
  update,
);

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
router.delete(
  "/:id",
  validate(idValidator),
  requirePermission("order.delete"),
  remove,
);

module.exports = router;
