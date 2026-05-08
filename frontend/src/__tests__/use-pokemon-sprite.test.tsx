import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { usePokemonSprite } from "@/hooks/use-pokemon-sprite";

const SPRITE_URL = "https://raw.githubusercontent.com/.../25.png";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePokemonSprite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          sprites: { front_default: SPRITE_URL },
        }),
    });
  });

  test("deve buscar sprite do Pikachu para ADMIN", async () => {
    const { result } = renderHook(() => usePokemonSprite("ADMIN"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("https://pokeapi.co/api/v2/pokemon/pikachu");

    expect(result.current.data).toBe(SPRITE_URL);
  });

  test("deve buscar sprite do Bulbasaur para COLLABORATOR", async () => {
    const { result } = renderHook(() => usePokemonSprite("COLLABORATOR"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("https://pokeapi.co/api/v2/pokemon/bulbasaur");

    expect(result.current.data).toBe(SPRITE_URL);
  });

  test("não deve buscar quando perfil é undefined", () => {
    const { result } = renderHook(() => usePokemonSprite(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("query deve ser desabilitada para perfil sem mapeamento", () => {
    const { result } = renderHook(() => usePokemonSprite("GUEST"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("isLoading deve ser true enquanto a requisição está em andamento", async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    sprites: {
                      front_default: "https://example.com/pikachu.png",
                    },
                  }),
              }),
            100, // 100ms de delay simulado
          ),
        ),
    );

    const { result } = renderHook(() => usePokemonSprite("ADMIN"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe("https://example.com/pikachu.png");
  });

  test("deve retornar null quando a API responde com erro", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => usePokemonSprite("ADMIN"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(globalThis.fetch).toHaveBeenCalledWith("https://pokeapi.co/api/v2/pokemon/pikachu");
  });
});
