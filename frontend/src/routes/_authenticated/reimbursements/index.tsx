import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { type SortingState, type PaginationState, type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useReimbursements, type ReimbursementParams } from "@/hooks/use-reimbursements";

interface Reimbursement {
  id: string;
  descricao: string;
  valor: number;
  status: string;
  dataDespesa: string;
  criadoEm: string;
  solicitante: { nome: string };
  categoria: { nome: string };
}

const dateOnly = (d: string) => d?.split(",")[0] ?? d;

const columns: ColumnDef<Reimbursement>[] = [
  { accessorKey: "descricao", header: "Description", enableSorting: true },
  {
    accessorKey: "valor",
    header: "Amount",
    enableSorting: true,
    cell: (info) => `R$ ${(info.getValue() as number).toFixed(2)}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: (info) => <StatusBadge status={info.getValue() as string} />,
  },
  {
    accessorKey: "dataDespesa",
    header: "Expense Date",
    enableSorting: true,
    cell: (info) => dateOnly(info.getValue() as string),
  },
  {
    accessorKey: "criadoEm",
    header: "Created",
    enableSorting: true,
    cell: (info) => dateOnly(info.getValue() as string),
  },
  { accessorFn: (row) => row.solicitante?.nome, id: "solicitante", header: "Requester" },
  { accessorFn: (row) => row.categoria?.nome, id: "categoria", header: "Category" },
];

const filterOptions = [
  { label: "Pending", value: "PENDING" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Paid", value: "PAID" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const Route = createFileRoute("/_authenticated/reimbursements/")({
  component: ReimbursementsList,
});

function ReimbursementsList() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const queryParams: ReimbursementParams = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sort: sorting[0]?.id,
    order: sorting[0]?.desc ? "desc" : "asc",
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };

  const { data, isLoading, isError, refetch } = useReimbursements(queryParams);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleFilter = useCallback((value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        searchPlaceholder="Search reimbursements..."
        searchValue={search}
        onSearch={handleSearch}
        filterLabel="Status"
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilter={handleFilter}
      />
      <DataTable<Reimbursement>
        columns={columns}
        data={(data?.data as unknown as Reimbursement[]) ?? []}
        pageCount={data?.meta.totalPages ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(row) => navigate({ to: "/reimbursements/$id", params: { id: row.id } })}
      />
    </div>
  );
}
