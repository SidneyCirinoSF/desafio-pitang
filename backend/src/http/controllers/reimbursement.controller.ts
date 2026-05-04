import type { Response } from "express";
import { prisma } from "../../lib/prisma.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import {
  createReimbursementSchema,
  updateReimbursementSchema,
  rejectReimbursementSchema,
  idParamSchema,
} from "../schemas/reimbursement.schema.js";
import { toDatabaseDate } from "../../lib/date.utils.js";

const solicitacaoInclude = {
  solicitante: {
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
    },
  },
  categoria: {
    select: {
      id: true,
      nome: true,
      ativo: true,
    },
  },
  anexos: true,
};

async function getSolicitacaoOr404(id: string, res: Response) {
  const solicitacao = await prisma.solicitacaoReembolso.findUnique({
    where: { id },
    include: solicitacaoInclude,
  });

  if (!solicitacao) {
    res.status(404).json({ message: "Solicitação não encontrada" });
    return null;
  }

  return solicitacao;
}

export async function getReimbursements(req: AuthRequest, res: Response) {
  let where: any = {};

  if (req.userPerfil === "COLLABORATOR") {
    where = { solicitanteId: req.userId };
  }

  const solicitacoes = await prisma.solicitacaoReembolso.findMany({
    where,
    include: solicitacaoInclude,
    orderBy: { criadoEm: "desc" },
  });

  return res.json(solicitacoes);
}

export async function getReimbursement(req: AuthRequest, res: Response) {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const { id } = parsed.data;
  const solicitacao = await getSolicitacaoOr404(id, res);
  if (!solicitacao) return;

  if (req.userPerfil === "COLLABORATOR" && solicitacao.solicitanteId !== req.userId) {
    return res.status(403).json({ message: "Acesso não permitido" });
  }

  return res.json(solicitacao);
}

export async function postReimbursement(req: AuthRequest, res: Response) {
  const parsed = createReimbursementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { dataDespesa, ...rest } = parsed.data;

  const solicitacao = await prisma.solicitacaoReembolso.create({
    data: {
      solicitanteId: req.userId,
      ...rest,
      dataDespesa: toDatabaseDate(dataDespesa),
    },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: solicitacao.id,
      usuarioId: req.userId,
      acao: "CREATED",
      observacao: "Solicitação criada",
    },
  });

  return res.status(201).json(solicitacao);
}

export async function patchReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const solicitacao = await getSolicitacaoOr404(id, res);
  if (!solicitacao) return;

  if (solicitacao.solicitanteId !== req.userId || solicitacao.status !== "PENDING") {
    return res.status(403).json({ message: "Solicitação não pode ser editada" });
  }

  const parsed = updateReimbursementSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const data: any = { ...parsed.data };

  if (data.dataDespesa) {
    data.dataDespesa = toDatabaseDate(data.dataDespesa);
  }

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data,
    include: solicitacaoInclude,
  });

  return res.json(updated);
}

export async function submitReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const solicitacao = await getSolicitacaoOr404(id, res);
  if (!solicitacao) return;

  if (solicitacao.solicitanteId !== req.userId || solicitacao.status !== "PENDING") {
    return res.status(403).json({ message: "Solicitação não pode ser enviada" });
  }

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data: { status: "SUBMITTED" },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: id,
      usuarioId: req.userId,
      acao: "SUBMITTED",
      observacao: "Solicitação enviada para análise",
    },
  });

  return res.json(updated);
}

export async function approveReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const solicitacao = await getSolicitacaoOr404(id, res);
  if (!solicitacao) return;

  if (solicitacao.status !== "SUBMITTED") {
    return res.status(400).json({ message: "Solicitação não está pendente de aprovação" });
  }

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data: { status: "APPROVED" },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: id,
      usuarioId: req.userId,
      acao: "APPROVED",
      observacao: "Solicitação aprovada",
    },
  });

  return res.json(updated);
}

export async function rejectReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const solicitacao = await getSolicitacaoOr404(id, res);
  if (!solicitacao) return;

  if (solicitacao.status !== "SUBMITTED") {
    return res.status(400).json({ message: "Solicitação não está pendente de aprovação" });
  }

  const parsed = rejectReimbursementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data: {
      status: "REJECTED",
      justificativaRejeicao: parsed.data.justificativaRejeicao,
    },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: id,
      usuarioId: req.userId,
      acao: "REJECTED",
      observacao: parsed.data.justificativaRejeicao,
    },
  });

  return res.json(updated);
}

export async function payReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const solicitacao = await getSolicitacaoOr404(id, res);
  if (!solicitacao) return;

  if (solicitacao.status !== "APPROVED") {
    return res.status(400).json({ message: "Solicitação não está aprovada para pagamento" });
  }

  const updated = await prisma.solicitacaoReembolso.update({
    where: { id },
    data: { status: "PAID" },
    include: solicitacaoInclude,
  });

  await prisma.historicoSolicitacao.create({
    data: {
      solicitacaoId: id,
      usuarioId: req.userId,
      acao: "PAID",
      observacao: "Pagamento realizado",
    },
  });

  return res.json(updated);
}

export async function getHistory(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const solicitacao = await prisma.solicitacaoReembolso.findUnique({
    where: { id },
  });

  if (!solicitacao) {
    return res.status(404).json({ message: "Solicitação não encontrada" });
  }

  if (req.userPerfil === "COLLABORATOR" && solicitacao.solicitanteId !== req.userId) {
    return res.status(403).json({ message: "Acesso não permitido" });
  }

  const historicos = await prisma.historicoSolicitacao.findMany({
    where: { solicitacaoId: id },
    include: {
      usuario: { select: { id: true, nome: true, email: true, perfil: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return res.json(historicos);
}

export async function addAttachment(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const solicitacao = await getSolicitacaoOr404(id, res);
  if (!solicitacao) return;

  if (
    solicitacao.solicitanteId !== req.userId ||
    !["PENDING", "SUBMITTED"].includes(solicitacao.status)
  ) {
    return res.status(403).json({
      message: "Não é permitido adicionar anexos",
    });
  }

  const { nomeArquivo, urlArquivo, tipoArquivo } = req.body;

  if (!nomeArquivo || !urlArquivo || !tipoArquivo) {
    return res.status(400).json({
      message: "Dados do anexo incompletos",
    });
  }

  const anexo = await prisma.anexo.create({
    data: { solicitacaoId: id, nomeArquivo, urlArquivo, tipoArquivo },
  });

  return res.status(201).json(anexo);
}

export async function getAttachments(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const solicitacao = await prisma.solicitacaoReembolso.findUnique({
    where: { id },
  });

  if (!solicitacao) {
    return res.status(404).json({ message: "Solicitação não encontrada" });
  }

  if (req.userPerfil === "COLLABORATOR" && solicitacao.solicitanteId !== req.userId) {
    return res.status(403).json({ message: "Acesso não permitido" });
  }

  const anexos = await prisma.anexo.findMany({
    where: { solicitacaoId: id },
    orderBy: { criadoEm: "desc" },
  });

  return res.json(anexos);
}
