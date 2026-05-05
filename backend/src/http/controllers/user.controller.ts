import type { Response } from "express";
import type { Request } from "express";
import { loginSchema, createUserSchema, updateUserSchema } from "../schemas/auth.schema.js";
import * as userService from "../../services/user.service.js";

export async function login(req: Request, res: Response) {
  const { email, senha } = loginSchema.parse(req.body);
  const result = await userService.login(email, senha);
  return res.json(result);
}

export async function getUsers(_req: Request, res: Response) {
  const users = await userService.listUsers();
  return res.json(users);
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
