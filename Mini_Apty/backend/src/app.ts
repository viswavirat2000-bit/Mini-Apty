import express from "express";
import authRouter from "./routes/auth";
import walkthroughRouter from "./routes/walkthroughs";
import { migrate } from "./db";
import swaggerUi from "swagger-ui-express";

// minimal OpenAPI spec for quick testing
const openapiSpec = {
  openapi: "3.0.0",
  info: { title: "Mini Apty API", version: "0.1.0" },
  servers: [{ url: "http://localhost:4000" }],
  paths: {
    "/api/auth/signup": {
      post: {
        summary: "Create account",
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email","password"] } } } },
        responses: { "201": { description: "Created" }, "400": { description: "Bad Request" } }
      }
    },
    "/api/auth/login": {
      post: {
        summary: "Login",
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email","password"] } } } },
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } }
      }
    },
    "/api/walkthroughs/mine": {
      get: {
        summary: "List my walkthroughs",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } }
      }
    }
  },
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } }
  }
};

const app: express.Express = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/walkthroughs", walkthroughRouter);

// Swagger UI for manual testing
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.get("/health", (req, res) => res.json({ status: "ok" }));

// error normalizer middleware
import errorNormalizer from "./middleware/errorNormalizer";
app.use(errorNormalizer);

// run migrations on start
migrate().catch((err) => console.error("Migration error", err));

export default app;
