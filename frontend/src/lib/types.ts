export type SortDirection = "asc" | "desc" | null;

export interface FilterOption {
  label: string;
  value: string;
}

export interface BreadcrumbItem {
  label: string;
  to?: string;
}
