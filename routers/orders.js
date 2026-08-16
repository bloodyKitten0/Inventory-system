const express = require(`express`);

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
} = require(`../controllers/orders`);

const router = express.Router();

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
router.get(`/orders`, read);

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
 *               - cid
 *               - wid
 *               - status
 *             properties:
 *               cid:
 *                 type: integer
 *                 description: Customer ID
 *               wid:
 *                 type: integer
 *                 description: Warehouse ID
 *               status:
 *                 type: string
 *                 description: Initial order status
 *                 example: pending
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post(`/orders`, create);

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
router.get(`/orders/customer/:id`, customerOrders);

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
router.get(`/orders/warehouse/:id`, warehouseOrders);

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
router.get(`/orders/:id/details`, orderDetails);

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
router.get(`/orders/:id/total`, calculateOrderTotal);

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
router.post(`/orders/:id/process`, processOrder);

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
 *         description: Order ID
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
router.patch(`/orders/:id/status`, updateStatus);

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
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found or cannot be cancelled
 */
router.patch(`/orders/:id/cancel`, cancelOrder);

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
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get(`/orders/:id`, readOne);

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
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cid
 *               - wid
 *               - status
 *             properties:
 *               cid:
 *                 type: integer
 *                 description: Customer ID
 *               wid:
 *                 type: integer
 *                 description: Warehouse ID
 *               status:
 *                 type: string
 *                 description: Order status
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put(`/orders/:id`, update);

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
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
router.delete(`/orders/:id`, remove);

module.exports = router;
