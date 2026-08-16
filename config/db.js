require("dotenv").config();

const { Pool } = require("pg");
const pg = new Pool({
  user: "postgres",
  host: "localhost",
  database: "inventory-system",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

module.exports = pg;
