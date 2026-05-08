import { describe, test, expect, beforeAll } from "bun:test";
import request from "supertest";
import { app } from "../src/app.js";

async function loginAs(email: string): Promise<string> {
  const res = await request(app).post("/auth/login").send({ email, senha: "123456" });

  const setCookie = res.headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

describe("Users", () => {
  let adminCookie: string;
  let collabCookie: string;

  beforeAll(async () => {
    adminCookie = await loginAs("admin@sistema.com");
    collabCookie = await loginAs("colaborador@sistema.com");
  });

  test("ADMIN pode listar usuários", async () => {
    const res = await request(app).get("/users").set("Cookie", adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  test("COLLABORATOR NÃO pode listar usuários", async () => {
    const res = await request(app).get("/users").set("Cookie", collabCookie);

    expect(res.status).toBe(403);
  });

  test("ADMIN pode criar usuário", async () => {
    const res = await request(app).post("/users").set("Cookie", adminCookie).send({
      nome: "Novo Usuário",
      email: "novo@teste.com",
      senha: "123456",
      perfil: "COLLABORATOR",
    });

    expect(res.status).toBe(201);
    expect(res.body.nome).toBe("Novo Usuário");
  });

  test("deve bloquear email duplicado", async () => {
    const res = await request(app).post("/users").set("Cookie", adminCookie).send({
      nome: "Duplicado",
      email: "admin@sistema.com",
      senha: "123456",
      perfil: "COLLABORATOR",
    });

    expect(res.status).toBe(409);
  });

  test("deve bloquear senha menor que 6 caracteres", async () => {
    const res = await request(app).post("/users").set("Cookie", adminCookie).send({
      nome: "Senha Curta",
      email: "senhacurta@teste.com",
      senha: "12345",
      perfil: "COLLABORATOR",
    });

    expect(res.status).toBe(400);
  });
});
