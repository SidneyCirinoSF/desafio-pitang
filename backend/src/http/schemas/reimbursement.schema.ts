import { z } from "zod";

export const createReimbursementSchema = z.object({
  categoriaId: z.string().uuid("Categoria inválida"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.number().positive("Valor deve ser positivo"),
  dataDespesa: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
});

export const updateReimbursementSchema = z.object({
  categoriaId: z.string().uuid().optional(),
  descricao: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  dataDespesa: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional(),
});

export const rejectReimbursementSchema = z.object({
  justificativaRejeicao: z.string().min(1, "Justificativa obrigatória"),
});

export const idParamSchema = z.object({
  id: z.string().uuid("ID inválido"),
});
