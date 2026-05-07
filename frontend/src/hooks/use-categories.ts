import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-reimbursements";

interface CategoriesParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
}

export function useCategories(params: CategoriesParams) {
  const queryString = new URLSearchParams();
  (Object.keys(params) as (keyof CategoriesParams)[]).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== "") {
      queryString.set(key, String(value));
    }
  });

  const qs = queryString.toString();

  return useQuery({
    queryKey: ["categories", params],
    queryFn: () =>
      api.get<PaginatedResponse<Record<string, unknown>>>(`/categories${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/categories", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.patch(`/categories/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
