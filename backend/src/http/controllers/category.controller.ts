import type { Response } from "express";
import { prisma } from "../../lib/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema.js";

async function getCategoriaOr404(id: string, res: Response) {
  const categoria = await prisma.categoria.findUnique({ where: { id } });

  if (!categoria) {
    res.status(404).json({ message: "Categoria não encontrada" });
    return null;
  }

  return categoria;
}

export async function getCategories(_req: AuthRequest, res: Response) {
  const categorias = await prisma.categoria.findMany({
    orderBy: { nome: "asc" },
  });
  res.json(categorias);
}

export async function getCategoryById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const categoria = await getCategoriaOr404((id as string) ?? "", res);
  if (!categoria) return;

  res.json(categoria);
}

export async function createCategory(req: AuthRequest, res: Response) {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { nome, ativo } = parsed.data;

  const existing = await prisma.categoria.findUnique({ where: { nome } });
  if (existing) {
    res.status(409).json({ message: "Categoria já existe" });
    return;
  }

  const categoria = await prisma.categoria.create({
    data: { nome, ativo },
  });

  res.status(201).json(categoria);
}

export async function updateCategory(req: AuthRequest, res: Response) {
  const { id } = req.params;

  const categoria = await getCategoriaOr404((id as string) ?? "", res);
  if (!categoria) return;

  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const updated = await prisma.categoria.update({
    where: { id: (id as string) ?? "" },
    data: parsed.data,
  });

  res.json(updated);
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  const id = req.params.id as string;

  const categoria = await getCategoriaOr404((id as string) ?? "", res);
  if (!categoria) return;

  const emUso = await prisma.solicitacaoReembolso.count({
    where: { categoriaId: id },
  });

  if (emUso > 0) {
    res.status(409).json({ message: "Categoria em uso em solicitações existentes" });
    return;
  }

  await prisma.categoria.delete({ where: { id: (id as string) ?? "" } });

  res.status(200).json({ message: "Categoria excluída com sucesso" });
}
