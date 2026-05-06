import type { Response } from "express";
import type { Request } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema.js";
import { paginationSchema } from "../schemas/query.schema.js";
import * as categoryService from "../../services/category.service.js";

export async function getCategories(req: Request, res: Response) {
  const params = paginationSchema.parse(req.query);
  const result = await categoryService.listCategories(params);
  return res.json(result);
}

export async function getCategoryById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const categoria = await categoryService.getCategoryById(id as string);
  return res.json(categoria);
}

export async function createCategory(req: AuthRequest, res: Response) {
  const data = createCategorySchema.parse(req.body);
  const categoria = await categoryService.createCategory(data);
  return res.status(201).json(categoria);
}

export async function updateCategory(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const data = updateCategorySchema.parse(req.body);
  const categoria = await categoryService.updateCategory(id as string, data);
  return res.json(categoria);
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  const id = req.params.id;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      message: "ID inválido",
      statusCode: 400,
      error: "Bad Request",
    });
  }
  await categoryService.deleteCategory(id as string);
  return res.status(200).json({ message: "Categoria excluída com sucesso" });
}
