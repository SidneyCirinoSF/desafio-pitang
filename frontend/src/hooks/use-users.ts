import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-reimbursements";

interface UsersParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
}

export function useUsers(params: UsersParams) {
  const queryString = new URLSearchParams();
  (Object.keys(params) as (keyof UsersParams)[]).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== "") {
      queryString.set(key, String(value));
    }
  });

  const qs = queryString.toString();

  return useQuery({
    queryKey: ["users", params],
    queryFn: () =>
      api.get<PaginatedResponse<Record<string, unknown>>>(`/users${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/users", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
