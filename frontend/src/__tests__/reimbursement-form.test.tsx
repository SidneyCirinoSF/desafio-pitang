import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";

import { ReimbursementForm } from "@/components/reimbursement-form";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/use-active-categories", () => ({
  useActiveCategories: () => ({
    data: [
      { id: "cat-1", nome: "Food", ativo: true },
      { id: "cat-2", nome: "Transport", ativo: true },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn().mockResolvedValue({}) },
  ApiRequestError: class extends Error {
    statusCode: number;
    error: string;
    constructor(msg: string) {
      super(msg);
      this.statusCode = 400;
      this.error = "Bad Request";
    }
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("ReimbursementForm", () => {
  test("deve mostrar erros de validação com campos vazios", async () => {
    render(<ReimbursementForm />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /create reimbursement/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid category")).toBeInTheDocument();
      expect(screen.getByText("Description is required")).toBeInTheDocument();
    });
  });

  test("deve mostrar erro para data futura", async () => {
    render(<ReimbursementForm />);

    const user = userEvent.setup();
    const futureDate = "2099-12-31";

    await user.type(screen.getByLabelText("Expense Date"), futureDate);
    await user.click(screen.getByRole("button", { name: /create reimbursement/i }));

    await waitFor(() => {
      expect(screen.getByText("Date cannot be in the future")).toBeInTheDocument();
    });
  });
});
