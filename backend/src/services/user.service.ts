import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { AppError } from "../lib/errors.js";

export const Perfil = {
  COLLABORATOR: "COLLABORATOR",
  MANAGER: "MANAGER",
  FINANCE: "FINANCE",
  ADMIN: "ADMIN",
} as const;
export type Perfil = (typeof Perfil)[keyof typeof Perfil];

const userSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

export async function login(email: string, senha: string) {
  const user = await prisma.user.findFirst({
    where: { email, deletadoEm: null },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  const valid = bcrypt.compareSync(senha, user.senha);
  if (!valid) {
    throw new AppError("Senha inválida", 401);
  }

  const token = signToken({ sub: user.id, perfil: user.perfil });

  return {
    token,
    user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil },
  };
}

export async function listUsers(params: {
  page: number;
  limit: number;
  sort?: string;
  order: "asc" | "desc";
  search?: string;
}) {
  const where: Record<string, unknown> = { deletadoEm: null };

  if (params.search) {
    where.OR = [{ nome: { contains: params.search } }, { email: { contains: params.search } }];
  }

  const sortField =
    params.sort && ["nome", "email", "perfil", "criadoEm"].includes(params.sort)
      ? params.sort
      : "criadoEm";
  const orderBy = { [sortField]: params.order };
  const skip = (params.page - 1) * params.limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy,
      skip,
      take: params.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, deletadoEm: null },
    select: userSelect,
  });
  if (!user) throw new AppError("Usuário não encontrado", 404);
  return user;
}

export async function createUser(data: {
  nome: string;
  email: string;
  senha: string;
  perfil?: Perfil;
}) {
  const { nome, email, senha, perfil } = data;

  const existing = await prisma.user.findFirst({
    where: { email, deletadoEm: null },
  });
  if (existing) {
    throw new AppError("Email já cadastrado", 409);
  }

  const hashed = bcrypt.hashSync(senha, 10);

  return prisma.user.create({
    data: { nome, email, senha: hashed, perfil: perfil ?? Perfil.COLLABORATOR },
    select: userSelect,
  });
}

export async function updateUser(
  id: string,
  data: { nome?: string; email?: string; senha?: string; perfil?: Perfil },
) {
  const user = await prisma.user.findFirst({ where: { id, deletadoEm: null } });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, deletadoEm: null },
    });
    if (existing) throw new AppError("Email já cadastrado", 409);
  }

  const updateData: Record<string, unknown> = { ...data };
  if (updateData.senha) {
    updateData.senha = bcrypt.hashSync(updateData.senha as string, 10);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: userSelect,
  });
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findFirst({ where: { id, deletadoEm: null } });
  if (!user) throw new AppError("Usuário não encontrado", 404);

  await prisma.user.update({
    where: { id },
    data: {
      deletadoEm: new Date(),
      email: `${user.email}_DELETED_${id}`,
    },
  });
}
