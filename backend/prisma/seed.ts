import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Iniciando seed...\n");

  const hash = bcrypt.hashSync("123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@sistema.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@sistema.com",
      senha: hash,
      perfil: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "financeiro@sistema.com" },
    update: {},
    create: {
      nome: "Financeiro",
      email: "financeiro@sistema.com",
      senha: hash,
      perfil: "FINANCE",
    },
  });

  await prisma.user.upsert({
    where: { email: "gestor@sistema.com" },
    update: {},
    create: {
      nome: "Gestor",
      email: "gestor@sistema.com",
      senha: hash,
      perfil: "MANAGER",
    },
  });

  await prisma.user.upsert({
    where: { email: "colaborador@sistema.com" },
    update: {},
    create: {
      nome: "Colaborador",
      email: "colaborador@sistema.com",
      senha: hash,
      perfil: "COLLABORATOR",
    },
  });

  console.log("Usuários criados:");
  console.log(`  ADMIN        | admin@sistema.com         | senha: 123456`);
  console.log(`  FINANCE      | financeiro@sistema.com    | senha: 123456`);
  console.log(`  MANAGER      | gestor@sistema.com        | senha: 123456`);
  console.log(`  COLLABORATOR | colaborador@sistema.com   | senha: 123456`);

  const categorias = [
    { nome: "Transporte" },
    { nome: "Alimentação" },
    { nome: "Hospedagem" },
    { nome: "Material de Escritório" },
    { nome: "Cursos e Treinamentos" },
  ];

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { nome: cat.nome },
      update: {},
      create: cat,
    });
  }

  console.log(`\nCategorias criadas: ${categorias.length}`);

  console.log("\nSeed concluído!");
}

seed()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
