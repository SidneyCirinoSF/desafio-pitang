import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";
import { useActiveCategories } from "@/hooks/use-active-categories";

const reimbursementSchema = z.object({
  categoriaId: z.string().uuid("Invalid category"),
  descricao: z.string().min(1, "Description is required"),
  valor: z.number().positive("Value must be positive"),
  dataDespesa: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)")
    .refine((val) => new Date(val) <= new Date(), "Date cannot be in the future"),
});

type ReimbursementFormData = z.infer<typeof reimbursementSchema>;

export const Route = createFileRoute("/_authenticated/reimbursements/new")({
  component: NewReimbursement,
});

function NewReimbursement() {
  const { data: categories, isLoading: catLoading } = useActiveCategories();
  const [catValue, setCatValue] = useState("");

  const form = useForm<ReimbursementFormData>({
    resolver: zodResolver(reimbursementSchema),
    defaultValues: { categoriaId: "", descricao: "", valor: 0, dataDespesa: "" },
  });

  useEffect(() => {
    if (catValue) {
      form.setValue("categoriaId", catValue, { shouldValidate: true });
    }
  }, [catValue, form]);

  async function onSubmit(data: ReimbursementFormData) {
    try {
      await api.post("/reimbursements", data);
      toast.success("Reimbursement created successfully!");
      form.reset();
      setCatValue("");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to connect to server");
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 items-center">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>New Reimbursement Request</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select value={catValue} onValueChange={setCatValue} disabled={catLoading}>
                  <SelectTrigger>
                    {catLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <SelectValue placeholder="Select a category" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoriaId && (
                  <p className="text-destructive text-sm font-medium">
                    {form.formState.errors.categoriaId.message}
                  </p>
                )}
              </FormItem>

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Lunch with client" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="120.50"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataDespesa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : "Create Reimbursement"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
