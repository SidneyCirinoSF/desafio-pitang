import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Reimbursement {
  id: string;
  descricao: string;
  valor: number;
  status: string;
  dataDespesa: string;
  criadoEm: string;
  atualizadoEm: string;
  justificativaRejeicao?: string;
  solicitante: { id: string; nome: string; email: string; perfil: string };
  categoria: { id: string; nome: string; ativo: boolean };
  anexos: {
    id: string;
    nomeArquivo: string;
    urlArquivo: string;
    tipoArquivo: string;
    criadoEm: string;
  }[];
}

interface HistoryEntry {
  id: string;
  acao: string;
  observacao?: string;
  criadoEm: string;
  usuario: { id: string; nome: string; email: string; perfil: string };
}

interface Attachment {
  id: string;
  nomeArquivo: string;
  urlArquivo: string;
  tipoArquivo: string;
  criadoEm: string;
}

export type { Reimbursement, HistoryEntry, Attachment };

export function useReimbursement(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reimbursement", id],
    queryFn: () => api.get<Reimbursement>(`/reimbursements/${id}`),
    enabled: !!id,
  });

  const historyQuery = useQuery({
    queryKey: ["reimbursement", id, "history"],
    queryFn: () => api.get<HistoryEntry[]>(`/reimbursements/${id}/history`),
    enabled: !!id,
  });

  const attachmentsQuery = useQuery({
    queryKey: ["reimbursement", id, "attachments"],
    queryFn: () => api.get<Attachment[]>(`/reimbursements/${id}/attachments`),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reimbursement", id] });
    queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
  };

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/reimbursements/${id}/submit`),
    onSuccess: () => invalidate(),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/reimbursements/${id}/approve`),
    onSuccess: () => invalidate(),
  });

  const rejectMutation = useMutation({
    mutationFn: (justificativaRejeicao: string) =>
      api.post(`/reimbursements/${id}/reject`, { justificativaRejeicao }),
    onSuccess: () => invalidate(),
  });

  const payMutation = useMutation({
    mutationFn: () => api.post(`/reimbursements/${id}/pay`),
    onSuccess: () => invalidate(),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/reimbursements/${id}/cancel`),
    onSuccess: () => invalidate(),
  });

  const editMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch(`/reimbursements/${id}`, data),
    onSuccess: () => invalidate(),
  });

  const addAttachmentMutation = useMutation({
    mutationFn: (data: { nomeArquivo: string; urlArquivo: string; tipoArquivo: string }) =>
      api.post(`/reimbursements/${id}/attachments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reimbursement", id, "attachments"] });
    },
  });

  return {
    ...query,
    history: historyQuery.data,
    historyLoading: historyQuery.isLoading,
    attachments: attachmentsQuery.data,
    attachmentsLoading: attachmentsQuery.isLoading,
    submit: submitMutation.mutateAsync,
    approve: approveMutation.mutateAsync,
    reject: rejectMutation.mutateAsync,
    pay: payMutation.mutateAsync,
    cancel: cancelMutation.mutateAsync,
    edit: editMutation.mutateAsync,
    addAttachment: addAttachmentMutation.mutateAsync,
    isMutating:
      submitMutation.isPending ||
      approveMutation.isPending ||
      rejectMutation.isPending ||
      payMutation.isPending ||
      cancelMutation.isPending ||
      editMutation.isPending ||
      addAttachmentMutation.isPending,
  };
}
