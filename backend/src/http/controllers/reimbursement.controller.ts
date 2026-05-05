import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import {
  createReimbursementSchema,
  updateReimbursementSchema,
  rejectReimbursementSchema,
  idParamSchema,
} from "../schemas/reimbursement.schema.js";
import * as reimbursementService from "../../services/reimbursement.service.js";

export async function getReimbursements(req: AuthRequest, res: Response) {
  const solicitacoes = await reimbursementService.listReimbursements(req.userId, req.userPerfil);
  return res.json(solicitacoes);
}

export async function getReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const solicitacao = await reimbursementService.getReimbursementById(id, req.userId, req.userPerfil);
  return res.json(solicitacao);
}

export async function postReimbursement(req: AuthRequest, res: Response) {
  const data = createReimbursementSchema.parse(req.body);
  const solicitacao = await reimbursementService.createReimbursement(data, req.userId);
  return res.status(201).json(solicitacao);
}

export async function patchReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = updateReimbursementSchema.parse(req.body);
  const solicitacao = await reimbursementService.updateReimbursement(id, data, req.userId);
  return res.json(solicitacao);
}

export async function submitReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const solicitacao = await reimbursementService.submitReimbursement(id, req.userId);
  return res.json(solicitacao);
}

export async function approveReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const solicitacao = await reimbursementService.approveReimbursement(id, req.userId);
  return res.json(solicitacao);
}

export async function rejectReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { justificativaRejeicao } = rejectReimbursementSchema.parse(req.body);
  const solicitacao = await reimbursementService.rejectReimbursement(id, justificativaRejeicao, req.userId);
  return res.json(solicitacao);
}

export async function payReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const solicitacao = await reimbursementService.payReimbursement(id, req.userId);
  return res.json(solicitacao);
}

export async function cancelReimbursement(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const solicitacao = await reimbursementService.cancelReimbursement(id, req.userId);
  return res.json(solicitacao);
}

export async function getHistory(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const historicos = await reimbursementService.getReimbursementHistory(id, req.userId, req.userPerfil);
  return res.json(historicos);
}

export async function addAttachment(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { nomeArquivo, urlArquivo, tipoArquivo } = req.body;

  if (!nomeArquivo || !urlArquivo || !tipoArquivo) {
    return res.status(400).json({
      message: "Dados do anexo incompletos",
      statusCode: 400,
      error: "Bad Request",
    });
  }

  const anexo = await reimbursementService.addAttachment(
    id,
    { nomeArquivo, urlArquivo, tipoArquivo },
    req.userId,
  );
  return res.status(201).json(anexo);
}

export async function getAttachments(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const anexos = await reimbursementService.getAttachments(id, req.userId, req.userPerfil);
  return res.json(anexos);
}
