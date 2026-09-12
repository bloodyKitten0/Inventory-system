const app = require("./app.js");
const { connect } = require("./config/redis.js");
const startServer = async () => {
  try {
    await connect();
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
startServer();
//
