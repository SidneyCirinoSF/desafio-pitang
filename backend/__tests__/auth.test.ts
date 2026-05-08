import { describe, test, expect } from "bun:test";
import request from "supertest";
import { app } from "../src/app.js";

describe("POST /auth/login", () => {
  test("deve autenticar com credenciais válidas e retornar cookie", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@sistema.com", senha: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("admin@sistema.com");

    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("deve retornar 401 com senha inválida", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@sistema.com", senha: "senha-errada" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  test("deve retornar 404 para email inexistente", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "ninguem@sistema.com", senha: "123456" });

    expect(res.status).toBe(404);
  });

  test("deve retornar 400 para campos vazios (Zod)", async () => {
    const res = await request(app).post("/auth/login").send({ email: "", senha: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

describe("GET /auth/me", () => {
  test("deve retornar o usuário com cookie válido", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "admin@sistema.com", senha: "123456" });

    const setCookie = loginRes.headers["set-cookie"];
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
    const cookie = cookies.map((c) => c.split(";")[0]).join("; ");

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("admin@sistema.com");
  });

  test("deve retornar 401 sem cookie", async () => {
    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  test("deve limpar o cookie", async () => {
    const res = await request(app).post("/auth/logout");

    expect(res.status).toBe(200);
  });
});
