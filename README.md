# Sistema de Solicitações de Reembolso

Aplicação fullstack para controle de solicitações de reembolso corporativo.

## Estrutura

| Pacote      | Descrição                                   | Documentação                   |
| ----------- | ------------------------------------------- | ------------------------------ |
| `backend/`  | API REST (Express + Prisma + JWT)           | [README](./backend/README.md)  |
| `frontend/` | Interface web (React + shadcnUI + TanStack) | [README](./frontend/README.md) |

## Tecnologias

**Backend:** Bun, Express 5, TypeScript, Prisma 7, SQLite (libSQL), JWT, Zod, bcryptjs

**Frontend:** React 19, Vite 8, TypeScript, TanStack Router/Query/Table, shadcnUI, TailwindCSS, Zod

**Testes:** Vitest, React Testing Library, Supertest, Bun Test Runner

## Como executar

### Pré-requisitos

- [Bun](https://bun.com/) instalado

### Backend

```bash
cd backend
bun install
cp .env.example .env        # configure JWT_SECRET
bun run db:generate
bun run db:push
bun run db:seed
bun run dev                  # http://localhost:3000
```

### Frontend

```bash
cd frontend
bun install
bun run dev                  # http://localhost:5173
```

## Credenciais de teste

| Perfil       | Email                   | Senha  |
| ------------ | ----------------------- | ------ |
| ADMIN        | admin@sistema.com       | 123456 |
| FINANCE      | financeiro@sistema.com  | 123456 |
| MANAGER      | gestor@sistema.com      | 123456 |
| COLLABORATOR | colaborador@sistema.com | 123456 |

## Funcionalidades principais

- Autenticação JWT com HTTP-only cookies
- RBAC com 4 perfis (COLLABORATOR, MANAGER, FINANCE, ADMIN)
- CRUD de usuários, categorias e solicitações de reembolso
- Fluxo completo: criar → submeter → aprovar/rejeitar → pagar
- Histórico de auditoria com registro de todas as ações
- Paginação, ordenação e filtros server-side
- Dashboard com métricas por perfil
- Interface responsiva (sidebar + drawer mobile)
- Testes automatizados
- Postman collection para testes manuais da API

## Scripts

### Testes

```bash
cd backend && bun run test     # 19 testes
cd frontend && bun run test    # 15 testes
```
