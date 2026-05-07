import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const userSchema = z.object({
  nome: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  senha: z.string().min(6, "Password must be at least 6 characters"),
  perfil: z.enum(["COLLABORATOR", "MANAGER", "FINANCE", "ADMIN"]),
});

const editUserSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email("Invalid email").optional(),
  senha: z.string().min(6).optional().or(z.literal("")),
  perfil: z.enum(["COLLABORATOR", "MANAGER", "FINANCE", "ADMIN"]).optional(),
});

type UserFormData = z.infer<typeof userSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData | EditUserFormData) => Promise<void>;
  defaultValues?: { nome?: string; email?: string; perfil?: string };
  loading?: boolean;
}

export function UserForm({ open, onOpenChange, onSubmit, defaultValues, loading }: UserFormProps) {
  const isEdit = !!defaultValues;
  const schema = isEdit ? editUserSchema : userSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      perfil: "COLLABORATOR" as const,
    },
  });

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        nome: defaultValues.nome ?? "",
        email: defaultValues.email ?? "",
        senha: "",
        perfil: (defaultValues.perfil as "COLLABORATOR" | "MANAGER" | "FINANCE" | "ADMIN") ?? "COLLABORATOR",
      });
    }
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "New User"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEdit ? "New Password (leave empty to keep)" : "Password"}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    {isEdit ? "Leave empty to keep current password" : "Minimum 6 characters"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="perfil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value as string} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COLLABORATOR">Collaborator</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading || !form.formState.isValid}>
                {loading ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
