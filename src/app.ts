import express from "express";
import type { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

import productsRouter from "./routers/products.js";
import categoriesRouter from "./routers/categories.js";
import customersRouter from "./routers/customers.js";
import suppliersRouter from "./routers/suppliers.js";
import warehousesRouter from "./routers/warehouses.js";
import productsSuppliersRouter from "./routers/products-suppliers.js";
import inventoryRouter from "./routers/inventory.js";
import ordersItemsRouter from "./routers/orders-items.js";
import ordersRouter from "./routers/orders.js";
import stockMovementsRouter from "./routers/stock-movements.js";
import authRouter from "./routers/auth.js";
import rolesRouter from "./routers/roles.js";

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
  apis: ["./src/routers/*.ts", "./dist/routers/*.js"],
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

app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
  });
});
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    message: "Internal server error",
  });
});

export default app;
