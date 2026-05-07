import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ReimbursementParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  status?: string;
  categoriaId?: string;
}

export type { PaginatedResponse, ReimbursementParams };

export function useReimbursements(params: ReimbursementParams) {
  const queryString = new URLSearchParams();
  (Object.keys(params) as (keyof ReimbursementParams)[]).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== "") {
      queryString.set(key, String(value));
    }
  });

  const qs = queryString.toString();

  return useQuery({
    queryKey: ["reimbursements", params],
    queryFn: () =>
      api.get<PaginatedResponse<Record<string, unknown>>>(`/reimbursements${qs ? `?${qs}` : ""}`),
  });
}
