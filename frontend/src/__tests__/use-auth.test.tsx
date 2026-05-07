import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";

import { AuthProvider } from "@/context/auth";
import { useAuth } from "@/hooks/use-auth";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockRejectedValue(new Error("401"));
  });

  test("estado inicial: isLoading true e user null", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test("login deve definir o usuário após sucesso", async () => {
    const mockUser = {
      id: "1",
      nome: "Admin",
      email: "admin@sistema.com",
      perfil: "ADMIN",
    };

    mockPost.mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login({ email: "admin@sistema.com", senha: "123456" });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  test("login com erro não deve definir usuário", async () => {
    mockPost.mockRejectedValueOnce(new Error("Invalid credentials"));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.login({ email: "errado", senha: "errada" });
      } catch {
        // espera-se que lance erro com credenciais inválidas
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test("logout deve limpar o usuário", async () => {
    const mockUser = {
      id: "1",
      nome: "Admin",
      email: "admin@sistema.com",
      perfil: "ADMIN",
    };
    mockPost.mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login({ email: "admin@sistema.com", senha: "123456" });
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockPost).toHaveBeenCalledWith("/auth/logout");
  });
});
