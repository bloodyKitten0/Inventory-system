const express = require("express");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const productsRouter = require("./routers/products.js");
const categoriesRouter = require("./routers/categories.js");
const customersRouter = require("./routers/customers.js");
const suppliersRouter = require("./routers/suppliers.js");
const warehousesRouter = require("./routers/warehouses.js");
const productsSuppliersRouter = require("./routers/products-suppliers.js");
const inventoryRouter = require("./routers/inventory.js");
const ordersItemsRouter = require("./routers/orders-items.js");
const ordersRouter = require("./routers/orders.js");
const stockMovementsRouter = require("./routers/stock-movements.js");
const authRouter = require("./routers/auth.js");
const rolesRouter = require("./routers/roles.js");

const app = express();

app.use(express.json());
app.use(cookieParser());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Inventory Management API",
      version: "1.0.0",
      description: "API for managing inventory data",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./routers/*.js"],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);
app.use("/customers", customersRouter);
app.use("/suppliers", suppliersRouter);
app.use("/warehouses", warehousesRouter);
app.use("/products-suppliers", productsSuppliersRouter);
app.use("/auth", authRouter);
app.use("/roles", rolesRouter);
app.use("/", inventoryRouter);
app.use("/", ordersItemsRouter);
app.use("/", ordersRouter);
app.use("/", stockMovementsRouter);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Internal server error",
  });
});

module.exports = app;
