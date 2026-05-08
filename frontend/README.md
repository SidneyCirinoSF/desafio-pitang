# Sistema de Solicitações de Reembolso - Frontend

Interface web para o sistema de reembolso corporativo, construída com React, TypeScript, Vite e shadcnUI.

## Tecnologias

| Camada               | Tecnologia                                                                     |
| -------------------- | ------------------------------------------------------------------------------ |
| Runtime / Bundler    | [Bun](https://bun.com/) / [Vite 8](https://vite.dev/)                          |
| Framework            | [React 19](https://react.dev/)                                                 |
| Linguagem            | [TypeScript 6](https://www.typescriptlang.org/)                                |
| Roteamento           | [TanStack Router](https://tanstack.com/router)                                 |
| Estado do Servidor   | [TanStack Query](https://tanstack.com/query)                                   |
| Tabelas              | [TanStack Table](https://tanstack.com/table)                                   |
| UI                   | [shadcnUI](https://ui.shadcn.com/) + [TailwindCSS 4](https://tailwindcss.com/) |
| Formulários          | [react-hook-form](https://react-hook-form.com/) + [Zod](https://zod.dev/)      |
| Ícones               | [Lucide React](https://lucide.dev/)                                            |
| Notificações         | [Sonner](https://sonner.emilkowal.ski/) (toast)                                |
| Linting / Formatação | [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)               |

## Arquitetura

```
src/
├── main.tsx                        # Entry point (ReactDOM.createRoot)
├── App.tsx                         # QueryClientProvider + AuthProvider + RouterProvider
├── index.css                       # TailwindCSS v4 + shadcn theme (CSS variables)
├── vite-env.d.ts
├── routeTree.gen.ts                # Auto-gerado pelo TanStack Router Vite plugin
├── components/
│   ├── ui/                         # 17 componentes shadcnUI
│   │   ├── alert-dialog.tsx        # Diálogo de confirmação
│   │   ├── avatar.tsx              # Avatar do usuário
│   │   ├── badge.tsx               # Etiqueta (status)
│   │   ├── breadcrumb.tsx          # Trilha de navegação
│   │   ├── button.tsx              # Botão (variants + sizes)
│   │   ├── card.tsx                # Cartão (header, content, footer)
│   │   ├── checkbox.tsx            # Caixa de seleção
│   │   ├── collapsible.tsx         # Conteúdo expansível
│   │   ├── dialog.tsx              # Modal
│   │   ├── dropdown-menu.tsx       # Menu suspenso
│   │   ├── form.tsx                # Integração react-hook-form + shadcn
│   │   ├── input.tsx               # Campo de texto
│   │   ├── label.tsx               # Rótulo
│   │   ├── select.tsx              # Dropdown de seleção
│   │   ├── separator.tsx           # Linha divisória
│   │   ├── sheet.tsx               # Drawer lateral (mobile)
│   │   ├── sidebar.tsx             # Barra lateral (provider, trigger, menu, groups)
│   │   ├── skeleton.tsx            # Placeholder de carregamento
│   │   ├── table.tsx               # Tabela base
│   │   ├── textarea.tsx            # Área de texto
│   │   └── tooltip.tsx             # Dica flutuante
│   ├── app-sidebar.tsx             # Sidebar principal (logo + NavMain + NavUser)
│   ├── nav-main.tsx                # Grupos de navegação colapsáveis por perfil
│   ├── nav-user.tsx                # Avatar + dropdown com nome/perfil + Sign out
│   ├── breadcrumbs.tsx             # Breadcrumbs dinâmicos (baseados na rota atual)
│   ├── data-table.tsx              # Tabela com useReactTable (server-side)
│   ├── page-header.tsx             # Cabeçalho de página (search + filter dropdown)
│   ├── login-form.tsx              # Formulário de login (react-hook-form + Zod)
│   ├── status-badge.tsx            # Badge colorido por status da solicitação
│   ├── confirm-dialog.tsx          # Diálogo de confirmação reutilizável
│   ├── user-form.tsx               # Formulário criar/editar usuário
│   ├── category-form.tsx           # Formulário criar/editar categoria
│   ├── attachment-upload.tsx       # Formulário de upload de anexo
│   └── reimbursement-form.tsx       # Formulário de criação de reembolso (componente extraído para testes)
├── context/
│   └── auth.tsx                    # AuthProvider + AuthContext (Context API)
├── hooks/
│   ├── use-auth.ts                 # Hook useAuth (consome AuthContext)
│   ├── use-mobile.ts               # Detecção de viewport mobile
│   ├── use-reimbursements.ts       # Lista paginada de solicitações
│   ├── use-reimbursement.ts        # Solicitação única + todas as mutations
│   ├── use-users.ts                # Lista + mutations (create, update, delete)
│   ├── use-categories.ts           # Lista + mutations (create, update, delete)
│   ├── use-active-categories.ts    # Categorias ativas (para dropdowns)
│   └── use-pokemon-sprite.ts        # Sprite de Pokémon por perfil (avatar via PokeAPI)
├── lib/
│   ├── api.ts                      # Fetch wrapper (base URL, credentials: include, error handling)
│   ├── query-client.ts             # Configuração do React Query (staleTime, retry)
│   ├── permissions.ts              # Definição de menus por perfil + breadcrumb labels
│   ├── types.ts                    # Tipos compartilhados (FilterOption, BreadcrumbItem)
│   └── utils.ts                    # cn() helper (clsx + tailwind-merge)
└── routes/
    ├── __root.tsx                  # Root layout (Toaster + Outlet)
    ├── index.tsx                   # / (Login, beforeLoad: redirect se autenticado)
    ├── _authenticated.tsx          # Layout autenticado (Sidebar + Breadcrumbs no header)
    └── _authenticated/
        ├── dashboard.tsx           # /dashboard (métricas: submitted, approved, rejected, paid)
        ├── reimbursements/
        │   ├── index.tsx           # /reimbursements (lista com DataTable + filtros)
        │   ├── new.tsx             # /reimbursements/new (formulário de criação)
        │   └── $id.tsx             # /reimbursements/$id (detalhes + histórico + ações)
        ├── users.tsx               # /users (CRUD ADMIN)
        └── categories.tsx          # /categories (CRUD ADMIN)
```

### Separação de responsabilidades

- **Routes (páginas)**: cada arquivo em `routes/` define uma rota e seu componente. Usam hooks para buscar dados e componentes para renderizar UI. Não contêm lógica de API diretamente.
- **Components**: componentes de UI reutilizáveis. Os componentes em `ui/` são do shadcnUI (Radix + Tailwind). Os demais são componentes de negócio específicos do sistema.
- **Hooks**: encapsulam chamadas à API via TanStack Query (`useQuery` para leitura, `useMutation` para escrita). Cada hook gerencia cache, loading, erro e invalidação.
- **Context**: `AuthContext` gerencia o estado global de autenticação (usuário logado, loading, funções login/logout).
- **Lib**: utilitários puros — cliente HTTP (`api.ts`), configuração de cache (`query-client.ts`), menus por perfil (`permissions.ts`).

## Como executar

### Pré-requisitos

- [Bun](https://bun.com/) instalado
- Backend rodando

### Setup

```bash
# Instalar dependências
bun install

# Configurar variáveis de ambiente (opcional)
cp .env.example .env
# VITE_API_URL=http://localhost:3000

# Iniciar servidor de desenvolvimento
bun run dev
```

O frontend inicia em `http://localhost:5173`.

### Credenciais de teste

As mesmas do banco de dados seed do backend:

| Perfil       | Email                   | Senha  |
| ------------ | ----------------------- | ------ |
| ADMIN        | admin@sistema.com       | 123456 |
| FINANCE      | financeiro@sistema.com  | 123456 |
| MANAGER      | gestor@sistema.com      | 123456 |
| COLLABORATOR | colaborador@sistema.com | 123456 |

## Autenticação

O fluxo de autenticação utiliza **HTTP-only cookies** gerenciados pelo backend:

```
┌──────────┐   POST /auth/login    ┌──────────┐
│ Frontend │ ─────────────────────▶│ Backend  │
│          │◀──── Set-Cookie ──────│          │
│          │     token=xxx          │          │
│          │     { user }           │          │
└──────────┘                       └──────────┘
     │
     │ Toda requisição fetch()
     │ envia credentials: "include"
     │ (cookie enviado automaticamente)
     ▼
┌──────────┐
│ Backend  │  Lê req.cookies["token"]
│          │  → authMiddleware
└──────────┘
```

**Características do cookie:**

- `HttpOnly: true` — inacessível via JavaScript (proteção XSS)
- `SameSite: Lax` — proteção CSRF
- `Max-Age: 3600` — expira em 1 hora (mesmo tempo do JWT)
- `Secure: true` — apenas em produção (HTTPS)

**Verificação de sessão:**

- Ao abrir a aplicação, `AuthProvider` chama `GET /auth/me` para restaurar a sessão
- Se o cookie for válido → `user` é preenchido → acesso liberado
- Se o cookie for inválido/expirado → `user` fica `null` → mostra login

**Proteção de rotas:**

- `_authenticated.tsx` (layout): `beforeLoad` chama `GET /auth/me` — se falhar → redireciona para `/`
- `index.tsx` (login): `beforeLoad` chama `GET /auth/me` — se sucesso → redireciona para `/dashboard`
- `dashboard.tsx`: `beforeLoad` → mesmo mecanismo

## Perfis e Permissões (RBAC)

### Visibilidade de menus no Sidebar

| Perfil           | Grupos no Menu                                                         |
| ---------------- | ---------------------------------------------------------------------- |
| **COLLABORATOR** | Reimbursements: New, My Reimbursements                                 |
| **MANAGER**      | Reimbursements: All Reimbursements                                     |
| **FINANCE**      | Reimbursements: All Reimbursements                                     |
| **ADMIN**        | Reimbursements: All Reimbursements + Administration: Users, Categories |

### Ações disponíveis por perfil e status

| Status    | COLLABORATOR                      | MANAGER         | FINANCE      | ADMIN |
| --------- | --------------------------------- | --------------- | ------------ | ----- |
| PENDING   | Submit, Edit, Cancel, +Attachment | —               | —            | View  |
| SUBMITTED | Cancel, +Attachment               | Approve, Reject | —            | View  |
| APPROVED  | —                                 | —               | Mark as Paid | View  |
| REJECTED  | —                                 | —               | —            | View  |
| PAID      | —                                 | —               | —            | View  |
| CANCELLED | —                                 | —               | —            | View  |

## Rotas do Frontend

| Rota                  | Página                                                           | Perfis       |
| --------------------- | ---------------------------------------------------------------- | ------------ |
| `/`                   | Login (redireciona para dashboard se logado)                     | Público      |
| `/dashboard`          | Dashboard com métricas (submitted, approved, rejected, paid)     | Todos        |
| `/reimbursements`     | Lista de solicitações (tabela paginada com sort/filter/search)   | Todos        |
| `/reimbursements/new` | Criar nova solicitação (form com dropdown de categorias ativas)  | COLLABORATOR |
| `/reimbursements/$id` | Detalhes da solicitação + histórico + anexos + ações contextuais | Todos        |
| `/users`              | CRUD de usuários (tabela + dialog create/edit/delete)            | ADMIN        |
| `/categories`         | CRUD de categorias (tabela + dialog create/edit/delete)          | ADMIN        |

## Componentes principais

| Componente         | Descrição                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `AppSidebar`       | Sidebar colapsável com logo, navegação por perfil e menu do usuário. Responsivo (Sheet mobile).           |
| `DataTable<T>`     | Tabela genérica com server-side pagination, sort (colunas clicáveis ▲/▼), estados de loading/erro/vazio.  |
| `PageHeader`       | Barra de busca + dropdown de filtro (condicional: só renderiza se `onSearch` for passado).                |
| `StatusBadge`      | Badge colorido: PENDING=amber, SUBMITTED=blue, APPROVED=green, REJECTED=red, PAID=purple, CANCELLED=gray. |
| `ConfirmDialog`    | Diálogo de confirmação reutilizável (título, descrição, confirmar/cancelar, variante destructive).        |
| `Breadcrumbs`      | Trilha de navegação dinâmica baseada em `useRouterState().location.pathname`.                             |
| `NavMain`          | Grupos de menu colapsáveis com ícones do Lucide.                                                          |
| `NavUser`          | Avatar com sprite de Pokémon por perfil (Pikachu=ADMIN, Bulbasaur=COLLABORATOR, Charmander=MANAGER, Squirtle=FINANCE) + dropdown (nome, email, perfil, Sign out). Fallback para iniciais quando offline. |
| `UserForm`         | Formulário criar/editar usuário (nome, email, senha, perfil). Validação Zod.                              |
| `CategoryForm`     | Formulário criar/editar categoria (nome, ativo). Validação Zod.                                           |
| `AttachmentUpload`  | Formulário de upload de anexo (nomeArquivo, urlArquivo, tipoArquivo).                                     |
| `ReimbursementForm` | Formulário de criação de solicitação com dropdown de categorias ativas, validação Zod e bloqueio de datas futuras. |

## Formulários e Validação (Zod)

Todos os formulários usam `react-hook-form` + `@hookform/resolvers/zod`:

```typescript
// Exemplo: schema de criação de reembolso
const reimbursementSchema = z.object({
  categoriaId: z.string().uuid("Invalid category"),
  descricao: z.string().min(1, "Description is required"),
  valor: z.number().positive("Value must be positive"),
  dataDespesa: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)")
    .refine((val) => new Date(val) <= new Date(), "Date cannot be in the future"),
});

// Uso no componente
const form = useForm<ReimbursementFormData>({
  resolver: zodResolver(reimbursementSchema),
});
```

**Schemas implementados:**

- **Login**: `email` (email válido) + `senha` (min 1)
- **Reimbursement (create)**: `categoriaId` (UUID), `descricao` (min 1), `valor` (positivo), `dataDespesa` (YYYY-MM-DD, sem datas futuras)
- **Reimbursement (edit)**: `descricao` (min 1), `valor` (positivo)
- **User (create)**: `nome` (min 1), `email` (email), `senha` (min 6), `perfil` (enum)
- **User (edit)**: todos opcionais, `senha` pode ser vazia (mantém atual)
- **Category**: `nome` (min 1), `ativo` (boolean)
- **Attachment**: `nomeArquivo` (min 1), `urlArquivo` (URL válida), `tipoArquivo` (enum: PDF/IMAGE/OTHER)

**Feedback visual:**

- **Inline**: mensagens de erro abaixo de cada campo (`FormMessage`)
- **Toast**: notificações de sucesso (verde) ou erro (vermelho) via `sonner`
- **Loading**: botões desabilitados com texto "Saving...", spinner no DataTable

## Fluxo de Status

```
PENDING ──submit──> SUBMITTED ──approve──> APPROVED ──pay──> PAID
   │                     │
   │                     └──reject──> REJECTED
   └──cancel──> CANCELLED
```

Cada transição:

- É acionada por botões contextuais visíveis apenas para o perfil correto (ex: [Approve] só aparece para MANAGER quando status = SUBMITTED)
- Passa por um `ConfirmDialog` antes de executar
- Chama o endpoint correspondente via `useMutation`
- Exibe toast de sucesso ou erro
- Invalida o cache do React Query (`invalidateQueries`) para recarregar os dados

## Estado do Servidor (React Query)

**Cache e invalidação:**

```
┌──────────────┐   useQuery()    ┌──────────────┐   fetch()    ┌──────────┐
│   Página     │───────────────▶│  Cache        │────────────▶│ Backend  │
│   List       │◀───────────────│  React Query  │◀────────────│ API      │
└──────────────┘   (cached 30s) └──────────────┘              └──────────┘
                                       │
                         invalidateQueries() após mutation
                                       │
                                       ▼
                         Refetch automático (dados frescos)
```

**Hooks de query (leitura):**

- `useReimbursements(params)` — lista paginada, query string automática
- `useReimbursement(id)` — solicitação única + histórico + anexos
- `useUsers(params)` — lista paginada
- `useCategories(params)` — lista paginada
- `useActiveCategories()` — categorias ativas (dropdown)
- Dashboard: `useQuery(["reimbursements", "stats"])` direto no componente

**Hooks de mutation (escrita):**

- Submit, approve, reject, pay, cancel, edit, addAttachment → `useReimbursement(id)`
- Create, update, delete user → `useCreateUser()`, `useUpdateUser()`, `useDeleteUser()`
- Create, update, delete category → `useCreateCategory()`, `useUpdateCategory()`, `useDeleteCategory()`

## Estados de UI padronizados

Todas as páginas de listagem seguem o mesmo padrão de 3 estados:

| Estado  | Renderização                                                                 |
| ------- | ---------------------------------------------------------------------------- |
| Loading | Spinner animado no centro da tabela (`<Loader2 className="animate-spin" />`) |
| Erro    | Card com mensagem de erro + botão "Retry"                                    |
| Vazio   | "No data found." no centro da tabela                                         |
| Dados   | Tabela com linhas clicáveis + controles de paginação                         |

## Testes Automatizados

Testes de componentes e hooks utilizando Vitest, React Testing Library e jsdom.

### Ferramentas

| Ferramenta                   | Uso                                             |
| ---------------------------- | ----------------------------------------------- |
| [Vitest](https://vitest.dev) | Test runner (API compatível com Jest)           |
| React Testing Library        | Renderização de componentes React em memória    |
| user-event                   | Simulação realista de interações do usuário     |
| jsdom                        | Ambiente de navegador simulado (DOM em memória) |

### Instalação

```bash
bun add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Configuração

A seção `test` no `vite.config.ts` define o ambiente e o arquivo de setup:

```typescript
test: {
  globals: true,
  environment: "jsdom",
  setupFiles: "./src/__tests__/setup.ts",
  css: false,
},
```

O arquivo `src/__tests__/setup.ts` carrega os matchers do `@testing-library/jest-dom`:

```typescript
import "@testing-library/jest-dom/vitest";
```

### Arquivos de teste

| Arquivo                                     | O que testa                                 | Cenários verificados                                                                                                                                       |
| ------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/__tests__/login-form.test.tsx`         | Comportamento do formulário de login        | Campos vazios mostram erros de validação; botão exibe "Signing in..." durante loading; submit com dados válidos chama `login()` e navega para `/dashboard` |
| `src/__tests__/reimbursement-form.test.tsx` | Validação do formulário de nova solicitação | Erros de validação com campos vazios; bloqueio de data futura                                                                                              |
| `src/__tests__/use-auth.test.tsx`           | Hook `useAuth` e `AuthProvider`             | Estado inicial (loading, user null); login bem-sucedido define usuário; login com erro não define usuário; logout limpa estado e chama API                 |
| `src/__tests__/use-pokemon-sprite.test.tsx` | Hook `usePokemonSprite`                     | ADMIN → Pikachu, COLLABORATOR → Bulbasaur; perfil `undefined` → query desabilitada; loading state; API com erro → retorna `null` |

### Estratégia de mocks

Cada arquivo de teste utiliza `vi.mock()` para substituir módulos externos e isolar o componente testado:

- **`@tanstack/react-router`** — substituído para evitar dependência do roteador real (`useNavigate`, `createFileRoute`)
- **`@/hooks/use-auth`** — substituído para controlar estado de autenticação nos testes de formulário
- **`@/lib/api`** — substituído para simular respostas da API sem requisições reais
- **`@/hooks/use-active-categories`** — substituído com dados mock de categorias
- **`globalThis.fetch`** — substituído no teste `use-pokemon-sprite` para simular respostas da PokeAPI
- **`sonner`** — substituído para evitar renderização de toasts no ambiente de teste

### Como executar

```bash
bun run test          # executa uma vez
bun run test:watch    # re-executa ao salvar arquivos
```

## Scripts

| Comando                | Descrição                           |
| ---------------------- | ----------------------------------- |
| `bun run dev`          | Iniciar servidor de desenvolvimento |
| `bun run build`        | Compilar TypeScript + build Vite    |
| `bun run preview`      | Servir build de produção localmente |
| `bun run test`         | Executar testes automatizados       |
| `bun run test:watch`   | Executar testes em modo watch       |
| `bun run lint`         | Executar ESLint                     |
| `bun run lint:fix`     | Corrigir problemas de lint          |
| `bun run format`       | Formatar código com Prettier        |
| `bun run format:check` | Verificar formatação (CI)           |

## Variáveis de Ambiente

| Variável       | Descrição               | Padrão                  |
| -------------- | ----------------------- | ----------------------- |
| `VITE_API_URL` | URL base da API backend | `http://localhost:3000` |
