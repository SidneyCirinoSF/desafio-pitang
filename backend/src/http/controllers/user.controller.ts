import bcrypt from "bcryptjs";

import type { Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { signToken } from "../../lib/jwt.js";
import { loginSchema, createUserSchema, updateUserSchema } from "../schemas/auth.schema.js";
import type { Request } from "express";

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, senha } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(400).json({ message: "Usuário não encontrado" });
    return;
  }

  const valid = bcrypt.compareSync(senha, user.senha);
  if (!valid) {
    res.status(400).json({ message: "Senha inválida" });
    return;
  }

  const token = signToken({ sub: user.id, perfil: user.perfil });

  res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
    },
  });
}

export async function getUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, nome: true, email: true, perfil: true, criadoEm: true, atualizadoEm: true },
  });
  res.json(users);
}

export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: (id as string) ?? "" },
    select: { id: true, nome: true, email: true, perfil: true, criadoEm: true, atualizadoEm: true },
  });

  if (!user) {
    res.status(404).json({ message: "Usuário não encontrado" });
    return;
  }

  res.json(user);
}

export async function createUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { nome, email, senha, perfil } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: "Email já cadastrado" });
    return;
  }

  const hashed = bcrypt.hashSync(senha, 10);

  const user = await prisma.user.create({
    data: { nome, email, senha: hashed, perfil },
    select: { id: true, nome: true, email: true, perfil: true, criadoEm: true, atualizadoEm: true },
  });

  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    console.log(parsed.error.issues);
    return res
      .status(400)
      .json({ message: "Dados inválidos", errors: parsed.error.flatten().fieldErrors });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (data["senha"]) {
    data["senha"] = bcrypt.hashSync(data["senha"] as string, 10);
  }

  const user = await prisma.user.update({
    where: { id: (id as string) ?? "" },
    data,
    select: { id: true, nome: true, email: true, perfil: true, criadoEm: true, atualizadoEm: true },
  });

  res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Usuário ${id} excluído com sucesso`,
    });
  } catch {
    return res.status(404).json({
      message: "Usuário não encontrado",
    });
  }
}
