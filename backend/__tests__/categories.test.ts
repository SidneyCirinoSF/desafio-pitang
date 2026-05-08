import { describe, test, expect, beforeAll } from "bun:test";
import request from "supertest";
import { app } from "../src/app.js";

async function loginAs(email: string): Promise<string> {
  const res = await request(app).post("/auth/login").send({ email, senha: "123456" });

  const setCookie = res.headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

describe("Categories", () => {
  let adminCookie: string;
  let collabCookie: string;

  beforeAll(async () => {
    adminCookie = await loginAs("admin@sistema.com");
    collabCookie = await loginAs("colaborador@sistema.com");
  });

  test("qualquer logado pode listar categorias", async () => {
    const res = await request(app).get("/categories").set("Cookie", collabCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  test("ADMIN pode criar categoria", async () => {
    const res = await request(app)
      .post("/categories")
      .set("Cookie", adminCookie)
      .send({ nome: "Nova Categoria Teste" });

    expect(res.status).toBe(201);
    expect(res.body.nome).toBe("Nova Categoria Teste");
  });

  test("COLLABORATOR NÃO pode criar categoria", async () => {
    const res = await request(app)
      .post("/categories")
      .set("Cookie", collabCookie)
      .send({ nome: "Categoria Inválida" });

    expect(res.status).toBe(403);
  });
});
