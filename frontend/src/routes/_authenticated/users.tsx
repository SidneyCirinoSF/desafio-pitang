import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { type SortingState, type PaginationState, type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UserForm } from "@/components/user-form";
import { Button } from "@/components/ui/button";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import { ApiRequestError } from "@/lib/api";

interface User {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  criadoEm: string;
}

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useUsers({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sort: sorting[0]?.id,
    order: sorting[0]?.desc ? "desc" : "asc",
    search: search || undefined,
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const users = (data?.data as unknown as User[]) ?? [];

  const columns: ColumnDef<User>[] = [
    { accessorKey: "nome", header: "Name", enableSorting: true },
    { accessorKey: "email", header: "Email", enableSorting: true },
    { accessorKey: "perfil", header: "Role", enableSorting: true },
    { accessorKey: "criadoEm", header: "Created", enableSorting: true },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setEditUser(u);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={() => setDeleteId(u.id)}
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
      await createUser.mutateAsync(data);
      toast.success("User created!");
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to create user");
    }
  }

  async function handleUpdate(data: Record<string, unknown>) {
    if (!editUser) return;
    const payload = { ...data };
    if (!payload.senha) delete payload.senha;
    try {
      await updateUser.mutateAsync({ id: editUser.id, ...payload });
      toast.success("User updated!");
      setFormOpen(false);
      setEditUser(null);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to update user");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteUser.mutateAsync(deleteId);
      toast.success("User deleted!");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to delete user");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        searchPlaceholder="Search users..."
        searchValue={search}
        onSearch={handleSearch}
      />

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditUser(null);
            setFormOpen(true);
          }}
        >
          New User
        </Button>
      </div>

      <DataTable<User>
        columns={columns}
        data={users}
        pageCount={data?.meta.totalPages ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(user) => {
          setEditUser(user);
          setFormOpen(true);
        }}
      />

      <UserForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditUser(null);
        }}
        onSubmit={(data) => (editUser ? handleUpdate(data) : handleCreate(data))}
        defaultValues={
          editUser
            ? { nome: editUser.nome, email: editUser.email, perfil: editUser.perfil }
            : undefined
        }
        loading={createUser.isPending || updateUser.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete User"
        description="Are you sure? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteUser.isPending}
      />
    </div>
  );
}
