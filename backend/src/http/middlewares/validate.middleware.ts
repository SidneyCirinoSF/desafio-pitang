import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import type { AuthRequest } from "./auth.middleware";

export function validate(schema: ZodSchema, source: "body" | "params" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        message: "Erro de validação",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    req[source] = result.data;
    next();
  };
}

export function validateIdParam(req: AuthRequest, res: Response, next: NextFunction) {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  next();
}
