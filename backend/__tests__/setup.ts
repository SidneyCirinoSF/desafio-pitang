import { beforeAll, afterAll } from "bun:test";

process.env["DATABASE_URL"] = "file:./test.db";
process.env["JWT_SECRET"] = "test-secret-key";

try {
  await Bun.file("test.db").delete();
} catch {
  // arquivo pode não existir na primeira execução
}

// Cria tabelas no banco limpo
const push = Bun.spawnSync(["bun", "run", "db:push"], {
  env: { ...process.env, DATABASE_URL: "file:./test.db" },
});

if (push.exitCode !== 0) {
  throw new Error("Falha ao criar tabelas: " + push.stderr.toString());
}

const seed = Bun.spawnSync(["bun", "run", "db:seed"], {
  env: { ...process.env, DATABASE_URL: "file:./test.db" },
});

if (seed.exitCode !== 0) {
  throw new Error("Falha ao popular banco: " + seed.stderr.toString());
}

beforeAll(() => {
  // Banco já está pronto do top-level acima
});

afterAll(async () => {
  const { prisma } = await import("../src/lib/prisma.js");
  await prisma.$disconnect();
  try {
    await Bun.file("test.db").delete();
  } catch {
    // ignore
  }
});
