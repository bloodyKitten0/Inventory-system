const sessions = require("../services/sessions.js");

const authenticate = async (req, res, next) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const session = await sessions.getSession(sessionId);

    if (!session) {
      return res.status(401).json({
        message: "This session is not valid",
      });
    }

    req.user = session;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
//
