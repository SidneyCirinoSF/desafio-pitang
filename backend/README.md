# Sistema de Solicitações de Reembolso - Backend

API REST para gerenciamento de solicitações de reembolso corporativo, construída com Node.js, TypeScript, Express e Prisma.

## Tecnologias

| Camada         | Tecnologia              |
| -------------- | ----------------------- |
| Runtime        | [Bun](https://bun.com/) |
| Linguagem      | TypeScript              |
| Framework HTTP | Express 5               |
| ORM            | Prisma 7                |
| Banco de dados | SQLite (via libSQL)     |
| Autenticação   | JWT (jsonwebtoken)      |
| Validação      | Zod                     |
| Criptografia   | bcryptjs                |
| CORS           | cors                    |
| Cookie         | cookie-parser           |

## Arquitetura

```
src/
├── index.ts              # Entry point (inicia o servidor)
├── app.ts                # Configuração do Express, middlewares, error handler
├── lib/
│   ├── prisma.ts         # Cliente Prisma (libSQL adapter)
│   ├── jwt.ts            # Assinatura e verificação de tokens JWT
│   ├── date.utils.ts     # Utilitários de data (timezone Brasil, formatação)
│   ├── intl.ts           # Serialização de datas para resposta JSON
│   └── errors.ts         # Classe AppError para erros de negócio
├── types/
│   └── express.d.ts      # Augmentação de tipos do Express
├── services/             # Camada de serviço (regras de negócio)
│   ├── user.service.ts
│   ├── category.service.ts
│   └── reimbursement.service.ts
├── http/
│   ├── controllers/      # Handlers HTTP (apenas parse/response)
│   │   ├── user.controller.ts
│   │   ├── category.controller.ts
│   │   └── reimbursement.controller.ts
│   ├── routes/           # Definição de rotas e permissões
│   │   ├── user.routes.ts
│   │   ├── category.routes.ts
│   │   └── reimbursement.routes.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # Autenticação JWT (cookie) e autorização RBAC
│   │   └── validate.middleware.ts # Validação via Zod
│   └── schemas/          # Schemas Zod para validação de entrada
│       ├── auth.schema.ts
│       ├── category.schema.ts
│       ├── query.schema.ts       # Paginação, ordenação e busca
│       └── reimbursement.schema.ts
prisma/
├── schema.prisma         # Modelo de dados
└── seed.ts               # Dados iniciais (usuários e categorias)
```

### Separação de responsabilidades

- **Controllers**: recebem a requisição HTTP, validam entrada com Zod (`schema.parse()`), chamam o service e retornam a resposta. Não contêm regras de negócio.
- **Services**: contêm toda a lógica de negócio, validações de estado e acesso ao banco via Prisma. Lançam `AppError` para erros previsíveis.
- **Schemas**: validam body, params e query params antes que os dados cheguem aos services. O `query.schema.ts` define o formato padrão de paginação (`page`, `limit`, `sort`, `order`, `search`) reutilizado por todos os endpoints de listagem.
- **Error Handler**: middleware global em `app.ts` captura `AppError` (erros de negócio) e `ZodError` (validação), formatando respostas padronizadas.

## Como executar

### Pré-requisitos

- [Bun](https://bun.com/) instalado

### Setup

```bash
# Instalar dependências
bun install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações:
#   DATABASE_URL="file:./dev.db"
#   JWT_SECRET="sua-chave-secreta"
#   CORS_ORIGIN="http://localhost:5173"

# Gerar cliente Prisma
bun run db:generate

# Criar banco e aplicar schema
bun run db:push

# Popular banco com dados iniciais
bun run db:seed

# Iniciar servidor
bun run dev
```

O servidor inicia em `http://localhost:3000`.

### Dados iniciais (seed)

| Perfil       | Email                   | Senha  |
| ------------ | ----------------------- | ------ |
| ADMIN        | admin@sistema.com       | 123456 |
| FINANCE      | financeiro@sistema.com  | 123456 |
| MANAGER      | gestor@sistema.com      | 123456 |
| COLLABORATOR | colaborador@sistema.com | 123456 |

Categorias pré-cadastradas: Transporte, Alimentação, Hospedagem, Material de Escritório, Cursos e Treinamentos.

## Autenticação

A autenticação utiliza **JWT armazenado em cookie HTTP-only**. Este modelo protege o token contra acesso via JavaScript (XSS) e contra CSRF (via `SameSite`).

### Fluxo

1. O frontend faz `POST /auth/login` com email e senha
2. O backend valida as credenciais e responde com `Set-Cookie` contendo o token JWT e `{ user }` no corpo
3. O navegador armazena o cookie e o envia automaticamente em todas as requisições subsequentes
4. O middleware `authMiddleware` lê o token de `req.cookies["token"]` em cada requisição protegida

### Propriedades do cookie

| Propriedade | Valor                   | Motivo                                         |
| ----------- | ----------------------- | ---------------------------------------------- |
| `HttpOnly`  | `true`                  | Inacessível via `document.cookie` (protege XSS) |
| `SameSite`  | `Lax`                   | Bloqueia envio em requisições cross-site (protege CSRF) |
| `Path`      | `/`                     | Disponível em todas as rotas da API            |
| `Max-Age`   | `3600` (1 hora)         | Mesmo tempo de expiração do JWT                 |
| `Secure`    | `true` em produção      | Só enviado via HTTPS                            |

### CORS

O middleware `cors` está configurado com `credentials: true` e `origin` definido pela variável `CORS_ORIGIN`. Isso permite que o frontend (em outra origem, ex: `localhost:5173`) receba e envie cookies.

O token contém o `id` e `perfil` do usuário (`{ sub, perfil }`).

## Perfis e Permissões (RBAC)

| Perfil           | Permissões                                                             |
| ---------------- | ---------------------------------------------------------------------- |
| **COLLABORATOR** | Criar, editar, visualizar e cancelar suas próprias solicitações        |
| **MANAGER**      | Visualizar todas as solicitações, aprovar ou rejeitar                  |
| **FINANCE**      | Visualizar todas as solicitações, marcar como pago                     |
| **ADMIN**        | Gerenciar usuários, categorias, ver todas as solicitações              |

## Endpoints da API

### Autenticação

| Método | Rota           | Descrição                                  | Autenticação |
| ------ | -------------- | ------------------------------------------ | ------------ |
| POST   | `/auth/login`  | Login (define cookie HTTP-only + retorna `{ user }`) | Não          |
| POST   | `/auth/logout` | Logout (limpa o cookie)                    | Não          |
| GET    | `/auth/me`     | Retorna o usuário da sessão atual          | Sim          |

**Login body:** `{ "email": "...", "senha": "..." }`

**Login response:** `{ "user": { "id": "...", "nome": "...", "email": "...", "perfil": "..." } }` + cookie `token` via `Set-Cookie`.

### Usuários (ADMIN)

| Método | Rota         | Descrição              |
| ------ | ------------ | ---------------------- |
| GET    | `/users`     | Listar usuários ativos |
| POST   | `/users`     | Criar usuário          |
| GET    | `/users/:id` | Obter usuário por ID   |
| PATCH  | `/users/:id` | Atualizar usuário      |
| DELETE | `/users/:id` | Soft delete de usuário |

### Categorias

| Método | Rota              | Descrição                                        | Perfil        |
| ------ | ----------------- | ------------------------------------------------ | ------------- |
| GET    | `/categories`     | Listar categorias                                | Autenticado   |
| GET    | `/categories/:id` | Obter categoria por ID                           | Autenticado   |
| POST   | `/categories`     | Criar categoria                                  | ADMIN         |
| PATCH  | `/categories/:id` | Atualizar categoria                              | ADMIN         |
| DELETE | `/categories/:id` | Soft delete de categoria (se não estiver em uso) | ADMIN         |

**Query params para `GET /categories`:**
Além dos parâmetros de paginação (veja abaixo), aceita:

| Parâmetro | Tipo    | Descrição                          |
| --------- | ------- | ---------------------------------- |
| `ativo`   | boolean | Filtra por categorias ativas (`true`/`false`) |

### Solicitações de Reembolso

| Método | Rota                              | Descrição             | Perfil                                   |
| ------ | --------------------------------- | --------------------- | ---------------------------------------- |
| GET    | `/reimbursements`                 | Listar solicitações   | COLLABORATOR (próprias) / outros (todas) |
| POST   | `/reimbursements`                 | Criar solicitação     | COLLABORATOR                             |
| GET    | `/reimbursements/stats`           | Métricas (submitted, approved, rejected, paid) | Todos                        |
| GET    | `/reimbursements/:id`             | Obter solicitação     | COLLABORATOR (própria) / outros (todas)  |
| PATCH  | `/reimbursements/:id`             | Editar solicitação    | COLLABORATOR (própria, pendente)         |
| POST   | `/reimbursements/:id/submit`      | Submeter para análise | COLLABORATOR (própria, pendente)         |
| POST   | `/reimbursements/:id/cancel`      | Cancelar solicitação  | COLLABORATOR (própria, pendente)         |
| POST   | `/reimbursements/:id/approve`     | Aprovar solicitação   | MANAGER                                  |
| POST   | `/reimbursements/:id/reject`      | Rejeitar solicitação  | MANAGER                                  |
| POST   | `/reimbursements/:id/pay`         | Marcar como pago      | FINANCE                                  |
| GET    | `/reimbursements/:id/history`     | Histórico de ações    | Todos com acesso à solicitação           |
| POST   | `/reimbursements/:id/attachments` | Adicionar anexo       | COLLABORATOR (própria)                   |
| GET    | `/reimbursements/:id/attachments` | Listar anexos         | Todos com acesso à solicitação           |

### Parâmetros de paginação, ordenação e busca

Todos os endpoints `GET /reimbursements`, `GET /users` e `GET /categories` aceitam os seguintes query params:

| Parâmetro | Tipo               | Padrão      | Descrição                                  |
| --------- | ------------------ | ----------- | ------------------------------------------ |
| `page`    | inteiro (positivo) | `1`         | Número da página                           |
| `limit`   | inteiro (1-100)    | `10`        | Itens por página                           |
| `sort`    | string             | (nenhum)    | Campo para ordenação (ex: `criadoEm`, `valor`, `nome`) |
| `order`   | `asc` ou `desc`    | `desc`      | Direção da ordenação                       |
| `search`  | string             | (nenhum)    | Termo de busca textual                     |

### Filtros específicos de solicitações

`GET /reimbursements` também aceita:

| Parâmetro     | Tipo          | Descrição                                    |
| ------------- | ------------- | ------------------------------------------- |
| `status`      | enum          | `PENDING`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PAID`, `CANCELLED` |
| `categoriaId` | UUID          | Filtra por categoria                        |
| `dataInicio`  | `YYYY-MM-DD`  | Data mínima da despesa                      |
| `dataFim`     | `YYYY-MM-DD`  | Data máxima da despesa                      |

### Fluxo de Status

```
PENDING ──submit──> SUBMITTED ──approve──> APPROVED ──pay──> PAID
   │                     │
   │                     └──reject──> REJECTED
   └──cancel──> CANCELLED
```

Toda transição de status é registrada na tabela `HistoricoSolicitacao`.

### Cancelamento

- Somente o colaborador que criou a solicitação pode cancelá-la
- Somente solicitações com status `PENDING` podem ser canceladas
- Solicitações já submetidas (`SUBMITTED`) ou em estágios posteriores não podem ser canceladas
- A ação é registrada no histórico (`acao: CANCELLED`)

## Banco de Dados

### Modelos

| Modelo                 | Descrição                                   |
| ---------------------- | ------------------------------------------- |
| `User`                 | Usuários do sistema (com soft delete)       |
| `Categoria`            | Categorias de despesa (com soft delete)     |
| `SolicitacaoReembolso` | Solicitações de reembolso (com soft delete) |
| `Anexo`                | Arquivos anexados às solicitações           |
| `HistoricoSolicitacao` | Registro de auditoria de todas as ações     |

### Enums

| Enum                | Valores                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| `Perfil`            | `COLLABORATOR`, `MANAGER`, `FINANCE`, `ADMIN`                                  |
| `StatusSolicitacao` | `PENDING`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PAID`, `CANCELLED`            |
| `AcaoHistorico`     | `CREATED`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PAID`, `CANCELLED`, `UPDATED` |

### Decisões de modelagem

- **UUID v7**: IDs ordenáveis temporalmente, facilitando queries e índices
- **Valor em centavos (Int)**: evita problemas de precisão de ponto flutuante em operações financeiras. A API recebe e retorna valores em reais (ex: `150.50`); internamente são armazenados como centavos (ex: `15050`)
- **Soft delete**: registros são marcados com `deletadoEm` em vez de removidos fisicamente, preservando integridade referencial e histórico

## Formato de Resposta

### Sucesso (objeto único)

Objetos JSON diretamente:

```json
{
  "id": "...",
  "nome": "João",
  "email": "joao@email.com",
  "perfil": "COLLABORATOR"
}
```

### Sucesso (coleção paginada)

Endpoints de listagem retornam o formato:

```json
{
  "data": [
    { "id": "...", "descricao": "Almoço", "valor": 120.50, "status": "PENDING" },
    { "id": "...", "descricao": "Transporte", "valor": 45.00, "status": "APPROVED" }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "totalPages": 5
  }
}
```

### Stats (métricas)

```json
{
  "submitted": 3,
  "approved": 5,
  "rejected": 1,
  "paid": 2
}
```

### Erro

```json
{
  "message": "Categoria não encontrada ou inativa",
  "statusCode": 400,
  "error": "Bad Request"
}
```

### Erro de validação

```json
{
  "message": "Dados inválidos",
  "statusCode": 400,
  "error": "Bad Request",
  "errors": {
    "email": ["Email inválido"],
    "senha": ["Senha obrigatória"]
  }
}
```

## Scripts

| Comando               | Descrição                          |
| --------------------- | ---------------------------------- |
| `bun run dev`         | Iniciar servidor com hot reload    |
| `bun run start`       | Iniciar servidor em produção       |
| `bun run db:generate` | Gerar cliente Prisma               |
| `bun run db:push`     | Sincronizar schema com banco       |
| `bun run db:migrate`  | Criar migration a partir do schema |
| `bun run db:seed`     | Popular banco com dados iniciais   |
| `bun run db:studio`   | Abrir Prisma Studio                |
| `bun run lint`        | Executar ESLint                    |
| `bun run lint:fix`    | Corrigir problemas de lint         |
| `bun run format`      | Formatar código com Prettier       |

## Variáveis de Ambiente

| Variável       | Descrição                     | Padrão                   |
| -------------- | ----------------------------- | ------------------------ |
| `DATABASE_URL` | URL de conexão do banco       | `file:./dev.db`          |
| `JWT_SECRET`   | Chave secreta para tokens JWT | (obrigatório)            |
| `CORS_ORIGIN`  | Origem permitida para CORS    | `http://localhost:5173`  |
| `PORT`         | Porta do servidor             | `3000`                   |
