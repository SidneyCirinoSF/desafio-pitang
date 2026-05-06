import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { userRoutes } from "./http/routes/user.routes.js";
import { reimbursementRoutes } from "./http/routes/reimbursement.routes.js";
import { categoryRoutes } from "./http/routes/category.routes.js";
import { serializeDates } from "./lib/intl.js";
import { AppError } from "./lib/errors.js";

const app = express();

app.use(
  cors({
    origin: process.env["CORS_ORIGIN"] ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(cookieParser());
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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      statusCode: err.statusCode,
      error: err.error,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Dados inválidos",
      statusCode: 400,
      error: "Bad Request",
      errors: err.flatten().fieldErrors,
    });
  }

  console.error("Erro não tratado:", err);
  return res.status(500).json({
    message: "Erro interno do servidor",
    statusCode: 500,
    error: "Internal Server Error",
  });
});

export { app };
