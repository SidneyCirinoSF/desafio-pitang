import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { toDatabaseDate } from "../lib/date.utils.js";
import { getActiveCategoryById } from "./category.service.js";

const CENTAVOS = 100;

function toCentavos(reais: number): number {
  return Math.round(reais * CENTAVOS);
}

function toReais(centavos: number): number {
  return centavos / CENTAVOS;
}

function formatSolicitacao<T extends { valor: number }>(solicitacao: T): T {
  return { ...solicitacao, valor: toReais(solicitacao.valor) } as T;
}

const solicitacaoInclude = {
  solicitante: {
    select: { id: true, nome: true, email: true, perfil: true },
  },
  categoria: {
    select: { id: true, nome: true, ativo: true },
  },
  anexos: true,
} as const;

async function findSolicitacaoOrThrow(id: string) {
  const solicitacao = await prisma.solicitacaoReembolso.findFirst({
    where: { id, deletadoEm: null },
    include: solicitacaoInclude,
  });
  if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);
  return formatSolicitacao(solicitacao);
}

function checkOwnership(solicitanteId: string, userId: string) {
  if (solicitanteId !== userId) {
    throw new AppError("Acesso não permitido", 403);
  }
}

export async function listReimbursements(userId: string, perfil: string) {
  const where: Record<string, unknown> = { deletadoEm: null };

  if (perfil === "COLLABORATOR") {
    where.solicitanteId = userId;
  }

  const solicitacoes = await prisma.solicitacaoReembolso.findMany({
    where,
    include: solicitacaoInclude,
    orderBy: { criadoEm: "desc" },
  });

  return solicitacoes.map(formatSolicitacao);
}

export async function getReimbursementById(id: string, userId: string, perfil: string) {
  const solicitacao = await findSolicitacaoOrThrow(id);

  if (perfil === "COLLABORATOR" && solicitacao.solicitanteId !== userId) {
    throw new AppError("Acesso não permitido", 403);
  }

  return solicitacao;
}

export async function createReimbursement(
  input: { categoriaId: string; descricao: string; valor: number; dataDespesa: string },
  userId: string,
) {
  await getActiveCategoryById(input.categoriaId);

  const solicitacao = await prisma.solicitacaoReembolso.create({
    data: {
      solicitanteId: userId,
      categoriaId: input.categoriaId,
      descricao: input.descricao,
      valor: toCentavos(input.valor),
      dataDespesa: toDatabaseDate(input.dataDespesa),
    },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: solicitacao.id,
      usuarioId: userId,
      acao: "CREATED",
      observacao: "Solicitação criada",
    },
  });

  return formatSolicitacao(solicitacao);
}

export async function updateReimbursement(
  id: string,
  input: { categoriaId?: string; descricao?: string; valor?: number; dataDespesa?: string },
  userId: string,
) {
  const solicitacao = await findSolicitacaoOrThrow(id);

  if (solicitacao.solicitanteId !== userId || solicitacao.status !== "PENDING") {
    throw new AppError("Solicitação não pode ser editada", 403);
  }

  const data: Record<string, unknown> = {};

  if (input.categoriaId !== undefined) {
    await getActiveCategoryById(input.categoriaId);
    data.categoriaId = input.categoriaId;
  }
  if (input.descricao !== undefined) data.descricao = input.descricao;
  if (input.valor !== undefined) data.valor = toCentavos(input.valor);
  if (input.dataDespesa !== undefined) data.dataDespesa = toDatabaseDate(input.dataDespesa);

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data,
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: id,
      usuarioId: userId,
      acao: "UPDATED",
      observacao: "Solicitação atualizada pelo colaborador",
    },
  });

  return formatSolicitacao(updated);
}

export async function submitReimbursement(id: string, userId: string) {
  const solicitacao = await findSolicitacaoOrThrow(id);

  if (solicitacao.solicitanteId !== userId || solicitacao.status !== "PENDING") {
    throw new AppError("Solicitação não pode ser enviada", 403);
  }

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data: { status: "SUBMITTED" },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: id,
      usuarioId: userId,
      acao: "SUBMITTED",
      observacao: "Solicitação enviada para análise",
    },
  });

  return formatSolicitacao(updated);
}

export async function approveReimbursement(id: string, userId: string) {
  const solicitacao = await findSolicitacaoOrThrow(id);

  if (solicitacao.status !== "SUBMITTED") {
    throw new AppError("Solicitação não está pendente de aprovação", 400);
  }

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data: { status: "APPROVED" },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: id,
      usuarioId: userId,
      acao: "APPROVED",
      observacao: "Solicitação aprovada",
    },
  });

  return formatSolicitacao(updated);
}

export async function rejectReimbursement(
  id: string,
  justificativaRejeicao: string,
  userId: string,
) {
  const solicitacao = await findSolicitacaoOrThrow(id);

  if (solicitacao.status !== "SUBMITTED") {
    throw new AppError("Solicitação não está pendente de aprovação", 400);
  }

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data: {
      status: "REJECTED",
      justificativaRejeicao,
    },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: id,
      usuarioId: userId,
      acao: "REJECTED",
      observacao: justificativaRejeicao,
    },
  });

  return formatSolicitacao(updated);
}

export async function payReimbursement(id: string, userId: string) {
  const solicitacao = await findSolicitacaoOrThrow(id);

  if (solicitacao.status !== "APPROVED") {
    throw new AppError("Solicitação não está aprovada para pagamento", 400);
  }

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data: { status: "PAID" },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: id,
      usuarioId: userId,
      acao: "PAID",
      observacao: "Pagamento realizado",
    },
  });

  return formatSolicitacao(updated);
}

export async function cancelReimbursement(id: string, userId: string) {
  const solicitacao = await findSolicitacaoOrThrow(id);

  checkOwnership(solicitacao.solicitanteId, userId);

  if (solicitacao.status !== "SUBMITTED") {
    throw new AppError(
      "Somente solicitações que ainda não foram submetidas para análise, podem ser canceladas",
      400,
    );
  }

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: id,
      usuarioId: userId,
      acao: "CANCELLED",
      observacao: "Solicitação cancelada pelo colaborador",
    },
  });

  return formatSolicitacao(updated);
}

export async function getReimbursementHistory(id: string, userId: string, perfil: string) {
  const solicitacao = await prisma.solicitacaoReembolso.findFirst({
    where: { id, deletadoEm: null },
  });

  if (!solicitacao) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  if (perfil === "COLLABORATOR" && solicitacao.solicitanteId !== userId) {
    throw new AppError("Acesso não permitido", 403);
  }

  return prisma.historicoSolicitacao.findMany({
    where: { solicitacaoId: id },
    include: {
      usuario: { select: { id: true, nome: true, email: true, perfil: true } },
    },
    orderBy: { criadoEm: "desc" },
  });
}

export async function addAttachment(
  id: string,
  data: { nomeArquivo: string; urlArquivo: string; tipoArquivo: string },
  userId: string,
) {
  const solicitacao = await findSolicitacaoOrThrow(id);

  if (
    solicitacao.solicitanteId !== userId ||
    !["PENDING", "SUBMITTED"].includes(solicitacao.status)
  ) {
    throw new AppError("Não é permitido adicionar anexos", 403);
  }

  return prisma.anexo.create({
    data: {
      solicitacaoId: id,
      nomeArquivo: data.nomeArquivo,
      urlArquivo: data.urlArquivo,
      tipoArquivo: data.tipoArquivo,
    },
  });
}

export async function getAttachments(id: string, userId: string, perfil: string) {
  const solicitacao = await prisma.solicitacaoReembolso.findFirst({
    where: { id, deletadoEm: null },
  });

  if (!solicitacao) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  if (perfil === "COLLABORATOR" && solicitacao.solicitanteId !== userId) {
    throw new AppError("Acesso não permitido", 403);
  }

  return prisma.anexo.findMany({
    where: { solicitacaoId: id },
    orderBy: { criadoEm: "desc" },
  });
}
