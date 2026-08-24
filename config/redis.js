const { createClient } = require(`redis`);

const client = createClient({
  url: "redis://localhost:6379",
});

const connect = async () => {
  await client.connect();
};

module.exports = { client, connect };
