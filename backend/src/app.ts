import express from "express";
import type { Request, Response, NextFunction } from "express";
import { userRoutes } from "./http/routes/user.routes.js";
import { reimbursementRoutes } from "./http/routes/reimbursement.routes.js";
import { categoryRoutes } from "./http/routes/category.routes.js";
import { serializeDates } from "./lib/intl.js";

const app = express();

app.use(express.json());

app.use((_req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    return originalJson(serializeDates(body));
  };
  next();
});

app.get("/", (_req, res) => {
  res.json({ message: "API - Sistema de Solicitações de Reembolso" });
});

app.use(userRoutes);
app.use("/reimbursements", reimbursementRoutes);
app.use("/categories", categoryRoutes);

export { app };
