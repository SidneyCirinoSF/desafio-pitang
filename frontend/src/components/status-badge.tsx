import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<
  string,
  {
    variant: "warning" | "info" | "success" | "destructive" | "secondary" | "outline";
    label: string;
  }
> = {
  PENDING: { variant: "warning", label: "Pending" },
  SUBMITTED: { variant: "info", label: "Submitted" },
  APPROVED: { variant: "success", label: "Approved" },
  REJECTED: { variant: "destructive", label: "Rejected" },
  PAID: { variant: "secondary", label: "Paid" },
  CANCELLED: { variant: "outline", label: "Cancelled" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { variant: "outline" as const, label: status };
  return <Badge variant={style.variant}>{style.label}</Badge>;
}
