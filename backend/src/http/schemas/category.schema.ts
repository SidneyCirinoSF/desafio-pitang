import { z } from "zod";

export const createCategorySchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  ativo: z.boolean().optional(),
});

export const updateCategorySchema = z
  .object({
    nome: z.string().min(1).optional(),
    ativo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser enviado",
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
