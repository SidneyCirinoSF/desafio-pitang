import type { Response } from "express";
import type { Request } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { loginSchema, createUserSchema, updateUserSchema } from "../schemas/auth.schema.js";
import { paginationSchema } from "../schemas/query.schema.js";
import * as userService from "../../services/user.service.js";

export async function login(req: Request, res: Response) {
  const { email, senha } = loginSchema.parse(req.body);
  const result = await userService.login(email, senha);

  res.cookie("token", result.token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
    path: "/",
    maxAge: 3600000,
  });

  return res.json({ user: result.user });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", { path: "/" });
  return res.json({ message: "Logout realizado com sucesso" });
}

export async function me(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const user = await userService.getUserById(authReq.userId);
  return res.json(user);
}

export async function getUsers(req: Request, res: Response) {
  const params = paginationSchema.parse(req.query);
  const result = await userService.listUsers(params);
  return res.json(result);
}

export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  const user = await userService.getUserById(id as string);
  return res.json(user);
}

export async function createUser(req: Request, res: Response) {
  const data = createUserSchema.parse(req.body);
  const user = await userService.createUser(data);
  return res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const data = updateUserSchema.parse(req.body);
  const user = await userService.updateUser(id as string, data);
  return res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const id = req.params.id;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      message: "ID inválido",
      statusCode: 400,
      error: "Bad Request",
    });
  }
  await userService.deleteUser(id as string);
  return res.status(200).json({ message: "Usuário excluído com sucesso" });
}
