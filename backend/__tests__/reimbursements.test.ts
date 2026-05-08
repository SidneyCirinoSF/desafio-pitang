import { describe, test, expect, beforeAll } from "bun:test";
import request from "supertest";
import { app } from "../src/app.js";

async function loginAs(email: string): Promise<string> {
  const res = await request(app).post("/auth/login").send({ email, senha: "123456" });

  const setCookie = res.headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

let collabCookie: string;
let managerCookie: string;
let financeCookie: string;
let categoriaId: string;

describe("Reimbursements", () => {
  beforeAll(async () => {
    collabCookie = await loginAs("colaborador@sistema.com");
    managerCookie = await loginAs("gestor@sistema.com");
    financeCookie = await loginAs("financeiro@sistema.com");

    const catRes = await request(app).get("/categories?limit=1").set("Cookie", collabCookie);
    categoriaId = catRes.body.data[0].id;
  });

  test("deve criar solicitação e retornar status PENDING", async () => {
    const res = await request(app).post("/reimbursements").set("Cookie", collabCookie).send({
      categoriaId,
      descricao: "Almoço com cliente",
      valor: 120.5,
      dataDespesa: "2026-05-04",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
    expect(res.body.descricao).toBe("Almoço com cliente");
    expect(res.body.valor).toBe(120.5);
  });

  test("deve bloquear criação com valor zero", async () => {
    const res = await request(app).post("/reimbursements").set("Cookie", collabCookie).send({
      categoriaId,
      descricao: "Teste",
      valor: 0,
      dataDespesa: "2026-05-04",
    });

    expect(res.status).toBe(400);
  });

  test("deve bloquear criação com categoria inválida", async () => {
    const res = await request(app).post("/reimbursements").set("Cookie", collabCookie).send({
      categoriaId: "00000000-0000-0000-0000-000000000000",
      descricao: "Teste",
      valor: 100,
      dataDespesa: "2026-05-04",
    });

    expect(res.status).toBe(400);
  });

  test("fluxo completo: criar → submeter → aprovar → pagar", async () => {
    const createRes = await request(app).post("/reimbursements").set("Cookie", collabCookie).send({
      categoriaId,
      descricao: "Material de escritório",
      valor: 250.0,
      dataDespesa: "2026-05-01",
    });

    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const submitRes = await request(app)
      .post(`/reimbursements/${id}/submit`)
      .set("Cookie", collabCookie);

    expect(submitRes.body.status).toBe("SUBMITTED");

    const collabApproveRes = await request(app)
      .post(`/reimbursements/${id}/approve`)
      .set("Cookie", collabCookie);
    expect(collabApproveRes.status).toBe(403);

    const approveRes = await request(app)
      .post(`/reimbursements/${id}/approve`)
      .set("Cookie", managerCookie);

    expect(approveRes.body.status).toBe("APPROVED");

    const managerPayRes = await request(app)
      .post(`/reimbursements/${id}/pay`)
      .set("Cookie", managerCookie);
    expect(managerPayRes.status).toBe(403);

    const payRes = await request(app)
      .post(`/reimbursements/${id}/pay`)
      .set("Cookie", financeCookie);

    expect(payRes.body.status).toBe("PAID");

    const historyRes = await request(app)
      .get(`/reimbursements/${id}/history`)
      .set("Cookie", collabCookie);

    expect(historyRes.body.length).toBeGreaterThanOrEqual(4);
  });
});
