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
│   │   ├── auth.middleware.ts    # Autenticação JWT e autorização RBAC
│   │   └── validate.middleware.ts # Validação via Zod
│   └── schemas/          # Schemas Zod para validação de entrada
│       ├── auth.schema.ts
│       ├── category.schema.ts
│       └── reimbursement.schema.ts
prisma/
├── schema.prisma         # Modelo de dados
└── seed.ts               # Dados iniciais (usuários e categorias)
```

### Separação de responsabilidades

- **Controllers**: recebem a requisição HTTP, validam entrada com Zod (`schema.parse()`), chamam o service e retornam a resposta. Não contêm regras de negócio.
- **Services**: contêm toda a lógica de negócio, validações de estado e acesso ao banco via Prisma. Lançam `AppError` para erros previsíveis.
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

Todas as rotas (exceto login) exigem token JWT enviado no header:

```
Authorization: Bearer <token>
```

O token é obtido via `POST /auth/login` e contém o `id` e `perfil` do usuário.

## Perfis e Permissões (RBAC)

| Perfil           | Permissões                                                             |
| ---------------- | ---------------------------------------------------------------------- |
| **COLLABORATOR** | Criar, editar, visualizar e cancelar suas próprias solicitações        |
| **MANAGER**      | Visualizar todas as solicitações, aprovar ou rejeitar                  |
| **FINANCE**      | Visualizar todas as solicitações, marcar como pago                     |
| **ADMIN**        | Gerenciar usuários, categorias, ver todas as solicitações e relatórios |

## Endpoints da API

### Autenticação

| Método | Rota          | Descrição                 | Autenticação |
| ------ | ------------- | ------------------------- | ------------ |
| POST   | `/auth/login` | Login (retorna token JWT) | Não          |

**Body:** `{ "email": "...", "senha": "..." }`

### Usuários (ADMIN)

| Método | Rota         | Descrição              |
| ------ | ------------ | ---------------------- |
| GET    | `/users`     | Listar usuários ativos |
| POST   | `/users`     | Criar usuário          |
| GET    | `/users/:id` | Obter usuário por ID   |
| PATCH  | `/users/:id` | Atualizar usuário      |
| DELETE | `/users/:id` | Soft delete de usuário |

### Categorias (ADMIN)

| Método | Rota              | Descrição                                        |
| ------ | ----------------- | ------------------------------------------------ |
| GET    | `/categories`     | Listar categorias ativas                         |
| POST   | `/categories`     | Criar categoria                                  |
| GET    | `/categories/:id` | Obter categoria por ID                           |
| PATCH  | `/categories/:id` | Atualizar categoria                              |
| DELETE | `/categories/:id` | Soft delete de categoria (se não estiver em uso) |

### Solicitações de Reembolso

| Método | Rota                              | Descrição             | Perfil                                   |
| ------ | --------------------------------- | --------------------- | ---------------------------------------- |
| GET    | `/reimbursements`                 | Listar solicitações   | COLLABORATOR (próprias) / outros (todas) |
| POST   | `/reimbursements`                 | Criar solicitação     | COLLABORATOR                             |
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
- Solicitações já submetidas (`SUBMITTED`) não podem ser canceladas
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

### Sucesso

Objetos JSON diretamente. Coleções como arrays JSON.

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

| Variável       | Descrição                     | Padrão          |
| -------------- | ----------------------------- | --------------- |
| `DATABASE_URL` | URL de conexão do banco       | `file:./dev.db` |
| `JWT_SECRET`   | Chave secreta para tokens JWT | (obrigatório)   |
| `PORT`         | Porta do servidor             | `3000`          |
