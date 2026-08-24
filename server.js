const app = require("./app.js");
const { connect } = require("./config/redis.js");

const startServer = async () => {
  await connect();

  app.listen(3000, () => {
    console.log("Server is running");
  });
};

startServer();
