const { hasPermission } = require(`../security/authorization.js`);
const test = require(`../services/try-catch.js`);

const requirePermission = (permissionName) => {
  return test(async (req, res, next) => {
    const allowed = await hasPermission(req.user.userId, permissionName);
    if (!allowed) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  });
};

module.exports = requirePermission;
//
