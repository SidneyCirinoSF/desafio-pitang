import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { type SortingState, type PaginationState, type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CategoryForm } from "@/components/category-form";
import { Button } from "@/components/ui/button";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-categories";
import { ApiRequestError } from "@/lib/api";

interface Category {
  id: string;
  nome: string;
  ativo: boolean;
  criadoEm: string;
}

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useCategories({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sort: sorting[0]?.id,
    order: sorting[0]?.desc ? "desc" : "asc",
    search: search || undefined,
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = (data?.data as unknown as Category[]) ?? [];

  const columns: ColumnDef<Category>[] = [
    { accessorKey: "nome", header: "Name", enableSorting: true },
    { accessorKey: "ativo", header: "Active", cell: (info) => (info.getValue() ? "Yes" : "No") },
    { accessorKey: "criadoEm", header: "Created", enableSorting: true },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setEditCategory(c);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={() => setDeleteId(c.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  async function handleCreate(data: Record<string, unknown>) {
    try {
      await createCategory.mutateAsync(data);
      toast.success("Category created!");
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to create category");
    }
  }

  async function handleUpdate(data: Record<string, unknown>) {
    if (!editCategory) return;
    try {
      await updateCategory.mutateAsync({ id: editCategory.id, ...data });
      toast.success("Category updated!");
      setFormOpen(false);
      setEditCategory(null);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to update category");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteCategory.mutateAsync(deleteId);
      toast.success("Category deleted!");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to delete category");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        searchPlaceholder="Search categories..."
        searchValue={search}
        onSearch={handleSearch}
      />

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditCategory(null);
            setFormOpen(true);
          }}
        >
          New Category
        </Button>
      </div>

      <DataTable<Category>
        columns={columns}
        data={categories}
        pageCount={data?.meta.totalPages ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(cat) => {
          setEditCategory(cat);
          setFormOpen(true);
        }}
      />

      <CategoryForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditCategory(null);
        }}
        onSubmit={(data) => (editCategory ? handleUpdate(data) : handleCreate(data))}
        defaultValues={
          editCategory ? { nome: editCategory.nome, ativo: editCategory.ativo } : undefined
        }
        loading={createCategory.isPending || updateCategory.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Category"
        description="Are you sure? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteCategory.isPending}
      />
    </div>
  );
}
