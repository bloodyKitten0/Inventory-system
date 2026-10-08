import { hasPermission } from "../security/authorization.js";
import test from "../services/try-catch.js";

const requirePermission = (permissionName: string) => {
  return test(async (req, res, next) => {
    const allowed = await hasPermission(req.user!.userId, permissionName);
    if (!allowed) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  });
};

export default requirePermission;
