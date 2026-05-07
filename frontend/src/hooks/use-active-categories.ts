import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Category {
  id: string;
  nome: string;
  ativo: boolean;
}

export function useActiveCategories() {
  return useQuery({
    queryKey: ["categories", "active"],
    queryFn: async () => {
      const result = await api.get<{ data: Category[]; meta: Record<string, unknown> }>(
        "/categories?ativo=true&limit=100",
      );
      return result.data;
    },
    staleTime: 60_000,
  });
}
