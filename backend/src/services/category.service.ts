import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";

export async function listCategories() {
  return prisma.categoria.findMany({
    where: { deletadoEm: null },
    orderBy: { nome: "asc" },
  });
}

export async function getCategoryById(id: string) {
  const categoria = await prisma.categoria.findFirst({
    where: { id, deletadoEm: null },
  });
  if (!categoria) throw new AppError("Categoria não encontrada", 404);
  return categoria;
}

export async function getActiveCategoryById(id: string) {
  const categoria = await prisma.categoria.findFirst({
    where: { id, deletadoEm: null, ativo: true },
  });
  if (!categoria) throw new AppError("Categoria não encontrada ou inativa", 400);
  return categoria;
}

export async function createCategory(data: { nome: string; ativo?: boolean }) {
  const existing = await prisma.categoria.findFirst({
    where: { nome: data.nome, deletadoEm: null },
  });
  if (existing) throw new AppError("Categoria já existe", 409);

  return prisma.categoria.create({
    data: { nome: data.nome, ativo: data.ativo },
  });
}

export async function updateCategory(id: string, data: { nome?: string; ativo?: boolean }) {
  const categoria = await getCategoryById(id);

  if (data.nome && data.nome !== categoria.nome) {
    const existing = await prisma.categoria.findFirst({
      where: { nome: data.nome, deletadoEm: null },
    });
    if (existing) throw new AppError("Já existe uma categoria com este nome", 409);
  }

  return prisma.categoria.update({
    where: { id },
    data,
  });
}

export async function deleteCategory(id: string) {
  const categoria = await getCategoryById(id);

  const emUso = await prisma.solicitacaoReembolso.count({
    where: { categoriaId: id, deletadoEm: null },
  });
  if (emUso > 0) {
    throw new AppError("Categoria em uso em solicitações existentes", 409);
  }

  await prisma.categoria.update({
    where: { id },
    data: {
      deletadoEm: new Date(),
      ativo: false,
      nome: `${categoria.nome}_DELETED_${id}`,
    },
  });
}
