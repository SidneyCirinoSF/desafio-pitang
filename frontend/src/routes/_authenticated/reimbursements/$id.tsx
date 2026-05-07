import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AttachmentUpload } from "@/components/attachment-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useReimbursement } from "@/hooks/use-reimbursement";
import { ApiRequestError } from "@/lib/api";
import { Link } from "@tanstack/react-router";

const editSchema = z.object({
  descricao: z.string().min(1, "Description is required"),
  valor: z.number().positive("Value must be positive"),
});

type EditFormData = z.infer<typeof editSchema>;

export const Route = createFileRoute("/_authenticated/reimbursements/$id")({
  component: ReimbursementDetail,
});

function ReimbursementDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const {
    data: reimbursement,
    isLoading,
    history,
    attachments,
    submit,
    approve,
    reject: rejectMutation,
    pay,
    cancel,
    edit,
    addAttachment,
    isMutating,
  } = useReimbursement(id);

  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [justification, setJustification] = useState("");
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { descricao: "", valor: 0 },
  });

  const perfil = user?.perfil;
  const status = reimbursement?.status;

  const canSubmit = perfil === "COLLABORATOR" && status === "PENDING";
  const canEdit = perfil === "COLLABORATOR" && status === "PENDING";
  const canCancel = perfil === "COLLABORATOR" && status === "PENDING";
  const canAddAttachment =
    perfil === "COLLABORATOR" && (status === "PENDING" || status === "SUBMITTED");
  const canApprove = perfil === "MANAGER" && status === "SUBMITTED";
  const canReject = perfil === "MANAGER" && status === "SUBMITTED";
  const canPay = perfil === "FINANCE" && status === "APPROVED";

  function openEditDialog() {
    if (!reimbursement) return;
    editForm.reset({
      descricao: reimbursement.descricao,
      valor: reimbursement.valor,
    });
    setEditOpen(true);
  }

  async function handleEdit(data: EditFormData) {
    try {
      await edit(data);
      toast.success("Request updated!");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Edit failed");
    }
  }

  async function handleAction(action: string) {
    try {
      if (action === "submit") {
        await submit();
        toast.success("Request submitted for review!");
      } else if (action === "approve") {
        await approve();
        toast.success("Request approved!");
      } else if (action === "pay") {
        await pay();
        toast.success("Payment confirmed!");
      } else if (action === "cancel") {
        await cancel();
        toast.success("Request cancelled!");
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Operation failed");
    } finally {
      setConfirmAction(null);
    }
  }

  async function handleReject() {
    if (!justification.trim()) return;
    try {
      await rejectMutation(justification);
      toast.success("Request rejected!");
      setRejectOpen(false);
      setJustification("");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Rejection failed");
    }
  }

  async function handleAddAttachment(data: {
    nomeArquivo: string;
    urlArquivo: string;
    tipoArquivo: string;
  }) {
    try {
      await addAttachment(data);
      toast.success("Attachment added!");
      setAttachmentOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Upload failed");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader />
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!reimbursement) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader />
        <div className="text-center py-12 text-muted-foreground">Request not found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/reimbursements">
            <ArrowLeft className="size-4 mr-1" /> Back
          </Link>
        </Button>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Request {reimbursement.id.slice(0, 8)}...</CardTitle>
          <StatusBadge status={reimbursement.status} />
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p>{reimbursement.descricao}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <p className="font-medium">R$ {reimbursement.valor.toFixed(2)}</p>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <p>{reimbursement.categoria.nome}</p>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Expense Date</Label>
              <p>{reimbursement.dataDespesa}</p>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p>{reimbursement.criadoEm}</p>
            </div>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Requester</Label>
            <p>
              {reimbursement.solicitante.nome} ({reimbursement.solicitante.email})
            </p>
          </div>
          {reimbursement.justificativaRejeicao && (
            <div className="grid gap-1">
              <Label className="text-xs text-destructive">Rejection Reason</Label>
              <p className="text-destructive">{reimbursement.justificativaRejeicao}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {(canSubmit ||
        canEdit ||
        canCancel ||
        canAddAttachment ||
        canApprove ||
        canReject ||
        canPay) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canSubmit && (
              <Button onClick={() => setConfirmAction("submit")} disabled={isMutating}>
                Submit for Review
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" onClick={openEditDialog} disabled={isMutating}>
                Edit
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                onClick={() => setConfirmAction("cancel")}
                disabled={isMutating}
              >
                Cancel
              </Button>
            )}
            {canAddAttachment && (
              <Button
                variant="outline"
                onClick={() => setAttachmentOpen(true)}
                disabled={isMutating}
              >
                Add Attachment
              </Button>
            )}
            {canApprove && (
              <Button onClick={() => setConfirmAction("approve")} disabled={isMutating}>
                Approve
              </Button>
            )}
            {canReject && (
              <Button
                variant="destructive"
                onClick={() => setRejectOpen(true)}
                disabled={isMutating}
              >
                Reject
              </Button>
            )}
            {canPay && (
              <Button onClick={() => setConfirmAction("pay")} disabled={isMutating}>
                Mark as Paid
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Attachments</CardTitle>
          {canAddAttachment && (
            <Button variant="outline" size="sm" onClick={() => setAttachmentOpen(true)}>
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {attachments && attachments.length > 0 ? (
            <div className="flex flex-col gap-2">
              {attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.urlArquivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="size-4" />
                  {a.nomeArquivo} ({a.tipoArquivo})
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attachments.</p>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <div className="flex flex-col gap-4">
              {history.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="size-2 rounded-full bg-primary mt-1.5" />
                    {i < history.length - 1 && (
                      <Separator orientation="vertical" className="flex-1" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 pb-4">
                    <p className="text-sm font-medium">{entry.acao}</p>
                    {entry.observacao && (
                      <p className="text-sm text-muted-foreground">{entry.observacao}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {entry.criadoEm} by {entry.usuario.nome} - {entry.usuario.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No history.</p>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={
          confirmAction === "submit"
            ? "Submit for Review"
            : confirmAction === "approve"
              ? "Approve Request"
              : confirmAction === "pay"
                ? "Mark as Paid"
                : "Cancel Request"
        }
        description={
          confirmAction === "submit"
            ? "Are you sure you want to submit this request for review?"
            : confirmAction === "approve"
              ? "Are you sure you want to approve this request?"
              : confirmAction === "pay"
                ? "Confirm that this request has been paid?"
                : "Are you sure you want to cancel this request? This action cannot be undone."
        }
        confirmLabel="Confirm"
        variant={confirmAction === "cancel" ? "destructive" : "default"}
        onConfirm={() => confirmAction && handleAction(confirmAction)}
        loading={isMutating}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>Provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Justification..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!justification.trim() || isMutating}
            >
              {isMutating ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="flex flex-col gap-4">
              <FormField
                control={editForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isMutating}>
                  {isMutating ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Attachment Dialog */}
      <AttachmentUpload
        open={attachmentOpen}
        onOpenChange={setAttachmentOpen}
        onSubmit={handleAddAttachment}
        loading={isMutating}
      />
    </div>
  );
}
