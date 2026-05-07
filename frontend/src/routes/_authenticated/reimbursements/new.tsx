import { createFileRoute } from "@tanstack/react-router";
import { ReimbursementForm } from "@/components/reimbursement-form";

export const Route = createFileRoute("/_authenticated/reimbursements/new")({
  component: ReimbursementForm,
});
