import { useQuery } from "@tanstack/react-query";

const POKEMON_MAP: Record<string, string> = {
  ADMIN: "pikachu",
  COLLABORATOR: "bulbasaur",
  MANAGER: "charmander",
  FINANCE: "squirtle",
};

interface PokemonResponse {
  sprites: {
    front_default: string;
  };
}

export function usePokemonSprite(perfil: string | undefined) {
  const pokemonName = perfil ? POKEMON_MAP[perfil] : undefined;

  return useQuery({
    queryKey: ["pokemon-sprite", perfil],
    queryFn: async (): Promise<string | null> => {
      if (!pokemonName) return null;

      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);

      if (!res.ok) {
        return null;
      }

      const data = (await res.json()) as PokemonResponse;

      return data.sprites.front_default;
    },
    enabled: !!pokemonName,
    staleTime: 60 * 60 * 1000,
  });
}
