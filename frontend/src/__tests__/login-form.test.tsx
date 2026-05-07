import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      login: vi.fn(),
      isLoading: false,
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
  });

  test("deve mostrar erros de validação com campos vazios", async () => {
    render(<LoginForm />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  test("botão deve mostrar 'Signing in...' quando isLoading for true", () => {
    vi.mocked(useAuth).mockReturnValue({
      login: vi.fn(),
      isLoading: true,
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });

    render(<LoginForm />);

    expect(screen.getByRole("button", { name: /signing in/i })).toBeInTheDocument();
  });

  test("deve chamar login e navegar ao submeter dados válidos", async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce(undefined);
    const mockNavigate = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(<LoginForm />);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("your@email.com"), "admin@sistema.com");
    await user.type(screen.getByPlaceholderText("Your password"), "123456");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "admin@sistema.com",
        senha: "123456",
      });
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard" });
    });
  });
});
