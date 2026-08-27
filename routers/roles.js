const express = require("express");
const router = express.Router();

const rolesController = require("../controllers/roles.js");
const authenticate = require("../middlewares/auth.js");
const requirePermission = require("../middlewares/authorization.js");

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role and access management
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get("/", requirePermission("role.read"), rolesController.readRoles);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a role
 *     tags: [Roles]
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
 *                 example: Ordering Manager
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Invalid role name
 *       409:
 *         description: Role already exists
 */
router.post("/", requirePermission("role.create"), rolesController.createRole);

/**
 * @swagger
 * /roles/accounts/{accountId}:
 *   get:
 *     summary: Get all roles assigned to an account
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account roles retrieved successfully
 *       404:
 *         description: Account not found
 */
router.get(
  "/accounts/:accountId",
  requirePermission("account.role.read"),
  rolesController.readAccountRoles,
);

/**
 * @swagger
 * /roles/accounts/{accountId}:
 *   post:
 *     summary: Grant a role to an account
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: accountId
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
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       201:
 *         description: Role granted successfully
 *       400:
 *         description: Invalid account or role ID
 *       404:
 *         description: Account or role not found
 *       409:
 *         description: Role already assigned
 */
router.post(
  "/accounts/:accountId",
  requirePermission("account.role.grant"),
  rolesController.grantRole,
);

/**
 * @swagger
 * /roles/accounts/{accountId}/{roleId}:
 *   delete:
 *     summary: Revoke a role from an account
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role revoked successfully
 *       400:
 *         description: Invalid account or role ID
 *       403:
 *         description: Last owner cannot be removed
 *       404:
 *         description: Account-role assignment not found
 */
router.delete(
  "/accounts/:accountId/:roleId",
  requirePermission("account.role.revoke"),
  rolesController.revokeRole,
);

/**
 * @swagger
 * /roles/{id}/permissions:
 *   get:
 *     summary: Get all permissions assigned to a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *       400:
 *         description: Invalid role ID
 *       404:
 *         description: Role not found
 */
router.get(
  "/:id/permissions",
  requirePermission("role.permission.read"),
  rolesController.readRolePermissions,
);

/**
 * @swagger
 * /roles/{id}/permissions:
 *   post:
 *     summary: Grant a permission to a role
 *     tags: [Roles]
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
 *               - permissionId
 *             properties:
 *               permissionId:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Permission granted successfully
 *       400:
 *         description: Invalid role or permission ID
 *       404:
 *         description: Role or permission not found
 *       409:
 *         description: Permission already granted
 */
router.post(
  "/:id/permissions",
  requirePermission("role.permission.grant"),
  rolesController.grantPermission,
);

/**
 * @swagger
 * /roles/{id}/permissions/{permissionId}:
 *   delete:
 *     summary: Revoke a permission from a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission revoked successfully
 *       400:
 *         description: Invalid role or permission ID
 *       -404:
 *         description: Role-permission assignment not found
 */
router.delete(
  "/:id/permissions/:permissionId",
  requirePermission("role.permission.revoke"),
  rolesController.revokePermission,
);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Get a role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *       400:
 *         description: Invalid role ID
 *       404:
 *         description: Role not found
 */
router.get("/:id", requirePermission("role.read"), rolesController.readRole);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       403:
 *         description: The owner role cannot be deleted
 *       404:
 *         description: Role not found
 */
router.delete(
  "/:id",
  requirePermission("role.delete"),
  rolesController.removeRole,
);

module.exports = router;
