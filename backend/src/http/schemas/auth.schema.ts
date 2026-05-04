import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});

export const createUserSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  perfil: z.enum(["COLLABORATOR", "MANAGER", "FINANCE", "ADMIN"]).optional(),
});

export const updateUserSchema = z
  .object({
    nome: z.string().min(1).optional(),
    email: z.string().email("Email inválido").optional(),
    senha: z.string().min(6).optional(),
    perfil: z.enum(["COLLABORATOR", "MANAGER", "FINANCE", "ADMIN"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser enviado",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
