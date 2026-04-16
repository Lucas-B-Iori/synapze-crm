# 🧭 Plano de Implementação Técnico: Synapze CRM

> **Versão:** 1.0 — Master Plan  
> **Responsável:** Tech Lead Sênior  
> **Metodologia:** Modular, de fora (Database) para dentro (UI), com entregáveis independentes por fase.

---

## 📌 Sumário Executivo

Este documento detalha a construção do **Synapze CRM** do zero até o go-live, com instruções técnicas granulares suficientes para que qualquer desenvolvedor da equipe possa executar sem ambiguidade. O plano assume as seguintes decisões técnicas estratégicas (que serão validadas com o time antes do start):

| Decisão | Escolha Proposta |
|---------|------------------|
| **Router Next.js** | `App Router` (Next.js 14+) — Server Components por padrão, Server Actions para mutações. |
| **UI Library** | `shadcn/ui` + `TailwindCSS` + `Framer Motion` — para alcançar a estética "Linear"/Dark premium com velocidade. |
| **Gerenciamento de Estado Server** | `TanStack Query` (React Query) para cache, sync e Optimistic UI. |
| **Gerenciamento de Estado Client** | `Zustand` para estados globais leves (UI, modais, sidebar). |
| **Forms** | `React Hook Form` + `Zod` — validação e tipagem end-to-end. |
| **Testes** | `Vitest` (unit/integração) + `Playwright` (E2E críticos). |
| **ORM/DB Client** | `Supabase` (Postgres) via `supabase-js` + SQL migrations nativas (`supabase db push`). |
| **Fila/Cache** | `Upstash Redis` para filas e rate-limiting. |
| **LLM/IA** | `OpenAI` (`text-embedding-3-small` + `gpt-4o-mini`). |
| **PWA** | Progressive Web App desde as primeiras semanas (installable, push notifications). |

---

## 🏛 Arquitetura Técnica Detalhada

### 1. Estrutura de Pastas do Monorepo

```
synapze-crm/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, type-check, test (PR)
│       └── e2e.yml             # Playwright (merge na main)
├── apps/
│   └── web/                    # Aplicação Next.js principal
│       ├── app/                # App Router
│       │   ├── (auth)/         # Grupos de rotas públicas (login, signup, invite)
│       │   ├── (dashboard)/    # Layout protegido do CRM
│       │   ├── api/            # Route Handlers (webhooks externos)
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ui/             # Componentes shadcn/ui puros
│       │   ├── layout/         # Shell, Sidebar, Header
│       │   ├── kanban/         # Dnd kit, cards, columns
│       │   ├── omnichannel/    # Chat, message bubbles, composer
│       │   ├── contacts/       # Grids, modais, forms
│       │   └── booking/        # Calendário interno e público
│       ├── hooks/              # Custom hooks (useWorkspace, useUserRole)
│       ├── lib/
│       │   ├── supabase/       # Clientes browser/server
│       │   ├── utils.ts        # cn(), formatters
│       │   └── constants.ts
│       ├── server/
│       │   ├── actions/        # Server Actions (Next.js)
│       │   ├── services/       # Regras de negócio puras
│       │   └── providers/      # Provider Pattern (WhatsApp, Email)
│       ├── types/
│       ├── styles/
│       └── tests/
├── packages/
│   ├── database/               # Migrations, seeds, schemas SQL
│   ├── email-templates/        # React Email templates
│   └── eslint-config/
├── supabase/                   # Config local do Supabase CLI
└── docker/
    └── evolution/              # Dockerfile + compose para Hostinger
```

### 2. Padrões de Código Obrigatórios

- **Server Actions:** Cada action vive em `apps/web/server/actions/{domain}.ts`. Deve retornar `{ data, error }` tipado. Nunca chamar action dentro de action.
- **Database:** Todo acesso ao banco passa por `server/services/`. Nunca query direto no componente (exceto leituras Realtime otimizadas).
- **RLS:** Toda tabela de tenant **DEVE** ter políticas RLS ativas antes do merge.
- **Optimistic UI:** Todo drag-and-drop (Kanban) e envio de mensagem deve usar `useMutation` do TanStack Query com `optimisticUpdate`.
- **Error Boundaries:** Cada rota de dashboard terá `error.tsx`. Sentry captura erros de Server Actions e Client Components.

---

## 🚀 Fase 0: Foundation & Setup (Semana 1)
> **Status:** ✅ Concluída com pendências externas documentadas abaixo.

> **Objetivo:** Ambiente de desenvolvimento impecável. Pipeline CI/CD, design system base, e projeto Supabase estruturado.

### F0.1 — Repositório e Tooling
- [x] Inicializar repo com `pnpm` workspaces.
- [x] Criar `apps/web` com Next.js (App Router, Tailwind, ESLint).
- [x] Configurar `prettier`, `eslint`, `husky` + `lint-staged`.
- [x] Instalar dependências base: `framer-motion`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `date-fns`, `lucide-react`.
- [x] Configurar `tsconfig` paths absolutos (`@/components`, `@/server`, etc.).

### F0.2 — Design System e Tokens
- [x] Inicializar `shadcn/ui` no projeto.
- [x] Definir tema `dark` como padrão, com tokens de cor customizados no `globals.css` (fundo `zinc-950`, bordas `zinc-800`, primário `indigo-500`).
- [x] Criar componentes base essenciais via shadcn: `button`, `dialog`, `dropdown-menu`, `input`, `sheet`, `skeleton`, `sonner`, `tooltip`, `badge`, `avatar`, `tabs`, `scroll-area`.
- [ ] Criar componentes próprios de layout: `AppShell`, `Sidebar`, `CommandPalette` (Ctrl+K), `ThemeToggle`. *(Adiado para início da Fase 1, quando o shell do dashboard for necessário)*
- [x] Estabelecer padrão de animação: transições de 150ms-200ms, easing `ease-out`, modais com scale-in suave.

### F0.2.1 — Setup PWA (Next.js)
- [x] Instalar `next-pwa` e configurar em `next.config.ts`.
- [x] Criar `public/manifest.json` com tema dark e display `standalone`.
- [x] `public/sw.js` gerado automaticamente pelo Workbox/next-pwa.
- [x] Adicionar meta tags PWA no `layout.tsx`.
- [ ] Testar instalação em iOS Safari e Android Chrome. *(Pendente — requer device/emulador físico)*

### F0.3 — Supabase Setup e Workflow de Migrations
- [ ] Criar projeto Supabase (Production) e outro (Staging/Local). *(Pendente — requer login do usuário no Supabase)*
- [x] Instalar e configurar `Supabase CLI` localmente (binário `bin/supabase.exe`).
- [x] Inicializar pasta `supabase/` com `supabase init`.
- [ ] Criar script `db:seed` e documentar fluxo de migration. *(Pendente — será feito junto com a primeira migration da Fase 1)*

### F0.4 — CI/CD e Deploy Inicial
- [ ] Conectar repo à Vercel (Production + Preview por branch). *(Pendente — ação necessária do usuário)*
- [x] Criar `.github/workflows/ci.yml`: `pnpm install` → `lint` → `type-check` → `vitest run`.
- [x] Criar `.github/workflows/e2e-core.yml` (Playwright) rodando **apenas os Caminhos Críticos**.
- [ ] Configurar variáveis de ambiente na Vercel. *(Pendente — depende da conexão com Vercel)*

### F0.5 — Estrutura de Autenticação Base
- [x] Configurar `Middleware` do Next.js para proteger rotas `(dashboard)`.
- [x] Criar `lib/supabase/client.ts` (browser) e `lib/supabase/server.ts` (server-side).
- [x] Criar páginas de login (`/login`) e callback de OAuth (`/auth/callback`).
- [x] Implementar estrutura do fluxo Email/Senha + Google OAuth via Supabase Auth.
- [x] Splash screen dark e app `standalone` configurados no PWA.

---

## 🚀 Fase 1: Auth, Workspaces e Segurança (Semanas 2-3)

> **Objetivo:** Sistema multi-tenant funcional com RLS, roles, e onboarding white-glove.

### F1.1 — Schema de Autenticação e Workspaces
**Arquivos:** `packages/database/migrations/001_auth_and_workspaces.sql`

```sql
-- Tabelas essenciais
profiles (id PK FK auth.users, full_name, avatar_url, created_at)
workspaces (id PK, name, slug, plan_tier, owner_id FK profiles, settings jsonb, created_at)
workspace_members (id PK, workspace_id FK, profile_id FK, role enum, created_at)
member_assignments (id PK, manager_id FK, professional_id FK, assistant_id FK, workspace_id FK)
```

- [ ] Criar tabelas acima com `uuid` como PK padrão.
- [ ] Criar `trigger` para criar `profile` automaticamente após signup no `auth.users`.
- [ ] Criar `function` PostgreSQL para verificar `current_user_role()` e `current_workspace_id()`.

### F1.2 — Row Level Security (RLS) — CRÍTICO
Para **cada** tabela de tenant, criar políticas:
- [ ] `workspaces`: owner vê tudo; members vêem apenas seu workspace.
- [ ] `workspace_members`: owner vê todos; professional vê a si mesmo; manager vê vínculos sob sua `member_assignments`.
- [ ] `profiles`: usuário vê a si mesmo; owner/manager do workspace vêem profiles vinculados.
- [ ] Testar RLS com queries simulando diferentes `auth.uid()` via `supabase test` ou scripts SQL.

### F1.3 — Server Actions de Workspace
- [ ] `createWorkspace(data)` — cria workspace e define owner.
- [ ] `inviteMember(email, role)` — envia convite via Resend (template básico) e cria registro em `workspace_members` (status `pending`).
- [ ] `acceptInvite(token)` — ativa membro no workspace.
- [ ] `updateMemberRole(memberId, newRole)` — apenas owner/manager.
- [ ] `switchWorkspace(workspaceId)` — atualiza cookie de sessão ativa.

### F1.4 — UI de Onboarding White-Glove
- [ ] Tela `/onboarding` para o primeiro login (completar nome, avatar).
- [ ] Tela `/admin/workspaces` (visão Synapze interna) para criar workspaces e convidar membros em lote.
- [ ] Sidebar com workspace switcher (dropdown) e lista de navegação.
- [ ] Componente `RoleBadge` para indicar visualmente a role do usuário.

### F1.5 — Guards e Permissionamento no Frontend
- [ ] Hook `usePermission(action: string)` — mapeia role → boolean.
- [ ] HOC `WithRole` ou padrão de early-return em páginas para esconder funcionalidades.
- [ ] Página 403 customizada para acessos negados.

---

## 🚀 Fase 2: Contatos, Custom Fields e Kanban (Semanas 4-6)

> **Objetivo:** Core do CRM operacional. CRUD de contatos, campos customizáveis (EAV), e Kanban drag-and-drop por profissional.

### F2.1 — Schema de Contatos e EAV
**Arquivos:** `packages/database/migrations/002_contacts_and_eav.sql`

```sql
contacts (id PK, workspace_id FK, full_name, email, phone, source, created_at, updated_at)
custom_field_definitions (id PK, workspace_id FK, name, field_type, options jsonb, required, order_index)
contact_custom_values (id PK, contact_id FK, field_definition_id FK, value_text)
contact_assignments (id PK, contact_id FK, profile_id FK, workspace_id FK)
```

- [ ] Criar tabelas com índices em `workspace_id` e `contact_id`.
- [ ] Garantir unique constraint: um contacto não pode ter dois valores para o mesmo campo customizado.
- [ ] Políticas RLS: professional vê apenas contatos atribuídos a ele (via `contact_assignments`), exceto owner/manager.

### F2.2 — CRUD de Contatos
- [ ] Server Actions: `createContact`, `updateContact`, `deleteContact`, `listContacts(filters)`.
- [ ] Página `/contacts` com tabela/data-grid (usando `@tanstack/react-table`):
  - Filtros por nome, telefone, profissional atribuído.
  - Ordenação e paginação server-side.
  - Botão "Novo Contato" abrindo modal com formulário dinâmico (campos fixos + custom fields do workspace).
- [ ] Criar componentes de input dinâmico para EAV: text, number, date, select, checkbox.

### F2.3 — Pipeline e Kanban
**Schema:** `packages/database/migrations/003_pipelines.sql`

```sql
pipelines (id PK, profile_id FK, workspace_id FK, name, created_at)
pipeline_stages (id PK, pipeline_id FK, name, color, order_index)
pipeline_cards (id PK, contact_id FK, stage_id FK, pipeline_id FK, position integer, notes, created_at)
```

- [ ] Criar tabela de pipelines (um por profissional por padrão, mas owner pode criar genéricos).
- [ ] Criar stages padrão ao criar pipeline (ex: "Novo Lead", "Em Atendimento", "Fechado").
- [ ] Integrar `@dnd-kit/core` + `@dnd-kit/sortable` para o Kanban.
- [ ] Implementar **Optimistic UI** no drag-and-drop:
  - TanStack Query atualiza cache local imediatamente.
  - Server Action `moveCard(cardId, newStageId, newPosition)` executa em background.
  - Rollback visual automático em caso de erro.
- [ ] Criar componentes: `KanbanBoard`, `KanbanColumn`, `KanbanCard` (com preview do contato e badge de prioridade).

### F2.4 — Modal "Visão 360°" — Estrutura Base
- [ ] Criar `ContactDetailModal` (ou drawer) usando `Dialog` do shadcn.
- [ ] Implementar navegação por abas:
  1. **Dados** — formulário de edição do contato.
  2. **Kanban** — mini-view do card no pipeline atual.
  3. **Chat** — feed vazio com placeholder (preparação para Fase 3).
  4. **Agenda** — mini-calendário com próximos compromissos (preparação para Fase 4).
  5. **Notas** — textarea privada por profissional.
  6. **Arquivos** — integração com Supabase Storage (uploader + lista).
  7. **Resumo IA** — placeholder para sumário (preparação para Fase 5).
- [ ] Garantir que Notas e Arquivos respeitem RLS por profissional.

---

## 🚀 Fase 3: Omnichannel — Email e WhatsApp (Semanas 7-9)

> **Objetivo:** Centralizar comunicação. Email (Resend) e WhatsApp (Meta + Evolution) unificados na tabela `messages`.

### F3.1 — Schema de Canais e Mensagens
**Arquivos:** `packages/database/migrations/004_channels_and_messages.sql`

```sql
channels (id PK, workspace_id FK, type enum('whatsapp_official','whatsapp_evolution','email'), name, credentials jsonb, status, created_at)
channel_assignments (id PK, channel_id FK, profile_id FK, is_default)
messages (id PK, workspace_id FK, contact_id FK, channel_id FK, direction enum('inbound','outbound'), content, metadata jsonb, attachments jsonb, status enum('sent','delivered','read','failed'), created_at)
```

- [ ] Criar tabela `channels` com campo `credentials` criptografado (usar `pgcrypto` do Postgres para criptografia em repouso, ou encriptar no server antes de inserir).
- [ ] Índice GIN em `messages.metadata` para queries rápidas.
- [ ] RLS em `messages`: profissional vê mensagens de contatos que lhe são atribuídos.

### F3.2 — Realtime de Mensagens
- [ ] Habilitar Supabase Realtime na tabela `messages`.
- [ ] Criar hook `useMessagesRealtime(contactId)` que se inscreve no canal e atualiza o feed de chat instantaneamente.
- [ ] Garantir que novas mensagens entrem no chat sem refresh.

### F3.3 — Provider Pattern de Mensagens
**Arquitetura:** Interface unificada `IMessagingProvider`.

```typescript
interface IMessagingProvider {
  sendMessage(channel: Channel, contact: Contact, content: string, attachments?: File[]): Promise<Message>;
  parseWebhook(payload: unknown): Promise<InboundMessagePayload>;
}
```

- [ ] Criar `server/providers/email.provider.ts` (Resend):
  - Envia email transacional e de canal.
  - Recebe webhooks de resposta (via Route Handler `/api/webhooks/resend`).
  - Anexa resposta do destinatário ao thread do contato.
- [ ] Criar `server/providers/whatsapp-meta.provider.ts`:
  - Integração com Meta Cloud API (envio de mensagens template e sessão).
  - Webhook handler `/api/webhooks/whatsapp/meta`.
- [ ] Criar `server/providers/whatsapp-evolution.provider.ts`:
  - Wrapper para API da Evolution (instância hospedada na Hostinger).
  - Webhook handler `/api/webhooks/whatsapp/evolution`.

### F3.4 — Containerização da Evolution API na Hostinger
> Decisão infra: VPS Hostinger rodará **1 instância Evolution** no desenvolvimento/homologação. Capacity estimada: ~5 instâncias simultâneas na VPS atual. Escalonamento físico somente após atingir 5 clientes ativos.

- [ ] Criar `docker/evolution/Dockerfile` baseado na imagem oficial da Evolution API.
- [ ] Criar `docker-compose.yml` com:
  - Evolution API (porta 8080).
  - Redis local para filas internas da Evolution.
  - Traefik ou Nginx como reverse proxy (SSL via Let's Encrypt).
- [ ] Documentar processo de deploy na VPS Hostinger (SSH, Docker, SSL).
- [ ] Criar script `provision-evolution.sh` para subir nova instância isolada (preparação para escalar além das 5 instâncias futuras).

### F3.5 — UI do Chat Omnichannel
- [ ] Componente `ChatThread` (scroll-area, message bubbles, timestamps).
- [ ] Componente `MessageComposer` (input + anexos + seletor de canal).
- [ ] Exibir badge do provider em cada mensagem (WhatsApp Oficial, Evolution, Email).
- [ ] Preview de anexos (imagens, PDFs) no chat.
- [ ] Typing indicator e estados de entrega (enviado, entregue, lido).

---

## 🚀 Fase 4: Booking e Formulários Públicos (Semanas 10-11)

> **Objetivo:** Agendamento híbrido (interno + público) e formulários de captura desacoplados.

### F4.1 — Schema de Agendamentos
**Arquivos:** `packages/database/migrations/005_booking.sql`

```sql
schedules (id PK, profile_id FK, workspace_id FK, timezone, slot_duration_minutes, buffer_minutes)
schedule_availabilities (id PK, schedule_id FK, day_of_week, start_time, end_time, is_available)
appointments (id PK, schedule_id FK, contact_id FK, start_time, end_time, status, notes, created_at)
```

- [ ] Criar tabelas com validações (ex: `start_time` < `end_time`).
- [ ] Criar função PostgreSQL `get_available_slots(schedule_id, date)` para calcular horários livres dinamicamente.

### F4.2 — Calendário Interno
- [ ] Página `/calendar` com visualização semanal/mensal.
- [ ] Componente `CalendarGrid` integrado ao `appointments`.
- [ ] Modal para criar/editar compromisso (vincular a contato existente ou criar rápido).
- [ ] Bloqueio de horários e visualização por profissional (manager vê múltiplos).

### F4.3 — Páginas Públicas de Booking
- [ ] Criar rota pública `/b/[scheduleSlug]` (ou `/book/[professionalSlug]`).
- [ ] UI clean e minimalista (diferente do dashboard, foco em conversão).
- [ ] Fluxo: selecionar dia → selecionar horário → preencher nome/email/telefone → confirmação.
- [ ] Ao confirmar, criar contato (se novo) + agendamento + enviar confirmação por email (Resend).

### F4.4 — Formulários de Captura (Custom Forms)
- [ ] Tabela `capture_forms` (workspace_id, title, fields jsonb, redirect_url, schedule_id FK opcional).
- [ ] Builder visual simples de formulários (drag-and-drop básico de campos).
- [ ] Rota pública `/f/[formSlug]` para renderizar o formulário.
- [ ] Ao submeter, criar contato com dados do formulário e redirecionar para booking (se configurado).

### F4.5 — Integração no Modal 360°
- [ ] Aba "Agenda" do modal mostrando histórico e próximos agendamentos do contato.
- [ ] Botão "Novo Agendamento" direto da ficha do contato.

---

## 🚀 Fase 5: IA, Vetorização e Automações (Semanas 12-14)

> **Objetivo:** Sumários inteligentes, embeddings locais com pgvector, e início do SynapzeAI Agent.

### F5.1 — Setup de Vetorização (pgvector)
> Decisão: Stack OpenAI (`text-embedding-3-small` + `gpt-4o-mini`). Dimensão do embedding: **1536**.

- [ ] Habilitar extensão `pgvector` no Supabase.
- [ ] Criar tabela `contact_embeddings`:
  ```sql
  contact_embeddings (id PK, contact_id FK, content_type, content_chunk, embedding vector(1536), created_at)
  ```
- [ ] Criar índice `hnsw` para busca por similaridade eficiente:
  ```sql
  CREATE INDEX idx_contact_embeddings_hnsw ON contact_embeddings USING hnsw (embedding vector_ip_ops);
  ```

### F5.2 — Pipeline de Embeddings
- [ ] Criar fila Upstash Queue (ou Redis List) chamada `embedding-jobs`.
- [ ] Criar Serverless Function/Vercel Cron (`/api/jobs/process-embeddings`) que consome a fila e:
  1. Coleta histórico de mensagens e notas de um contato.
  2. Chama OpenAI API `text-embedding-3-small` com chunking de ~1000 tokens / overlap de 100 tokens.
  3. Armazena chunks vetorizados (1536 dimensões) em `contact_embeddings`.
- [ ] Trigger automático: toda nova mensagem inbound dispara `LPUSH embedding-jobs {contactId}` (assíncrono, não bloqueia o chat).

### F5.3 — Sumários Contextuais (Sob Demanda)
- [ ] Criar Server Action `generateContactSummary(contactId)`.
- [ ] Realizar busca vetorial `ORDER BY embedding <-> query_embedding LIMIT 10` nos últimos chunks do contato.
- [ ] Montar prompt estruturado para `gpt-4o-mini`:
  - Contexto: histórico de conversas e notas.
  - Instrução: gere um resumo executivo (3-5 bullets) do paciente/cliente.
  - Tom: profissional, direto, sem jargões técnicos desnecessários.
- [ ] Exibir resultado na aba "Resumo IA" do modal 360° com skeleton loading.
- [ ] Cachear resultado por 1 hora no Redis (Upstash) usando chave `summary:{contactId}`.

### F5.4 — SynapzeAI Agent (Chatbot Interno)
- [ ] Criar interface de chat flutuante no dashboard (estilo Claude/ChatGPT mini).
- [ ] Contexto: o agente responde perguntas sobre o workspace ("Quais leads não tiveram contato há 3 dias?").
- [ ] Implementar RAG simples: query SQL gerada por LLM a partir de schema conhecido (com sandboxing e validação).
- [ ] Fase inicial sem ações destrutivas (apenas leitura).

### F5.5 — Automações de Workflow (MVP Simples)
- [ ] Tabela `workflows` (workspace_id, trigger_event, conditions jsonb, actions jsonb, active).
- [ ] Triggers iniciais: "Novo lead criado", "Mensagem não respondida em X horas", "Agendamento confirmado".
- [ ] Actions iniciais: "Enviar email", "Mover card no Kanban", "Criar tarefa/alerta".
- [ ] Executar workflows via Route Handler chamado por webhook do Supabase (Edge Functions ou cron).

---

## 🚀 Fase 6: Monetização, Analytics e Polish (Semanas 15-16)

> **Objetivo:** Tornar o produto comercializável com Stripe, limites de uso, tracking e notificações.

### F6.1 — Integração Stripe
- [ ] Criar conta Stripe e configurar produtos/planos (Starter, Pro, Enterprise).
- [ ] Tabela `subscriptions` (workspace_id, stripe_customer_id, stripe_subscription_id, status, current_period_end).
- [ ] Webhook handler `/api/webhooks/stripe` para sincronizar status de pagamento.
- [ ] Server Action `createCheckoutSession(workspaceId, priceId)`.
- [ ] Server Action `createCustomerPortalSession(workspaceId)`.

### F6.2 — Engine de Quotas e Limits
- [ ] Criar tabela `plan_limits` (plan_tier, max_seats, max_messages, max_storage_gb).
- [ ] Middleware/Server Action que verifica limits antes de criar novos recursos (ex: bloquear novo seat se excedido).
- [ ] UI de upgrade quando próximo do limite (banner no topo do dashboard).

### F6.3 — Analytics com PostHog
- [ ] Instalar `posthog-js` no frontend.
- [ ] Tracking de eventos críticos: `contact_created`, `message_sent`, `kanban_card_moved`, `appointment_booked`.
- [ ] Identificação de usuários e workspaces.
- [ ] Criar dashboard no PostHog para métricas de produto (activation, retention).

### F6.4 — Monitoramento e Error Tracking (Sentry)
- [ ] Configurar `Sentry` no Next.js (cliente e servidor).
- [ ] Adicionar `captureException` em todos os catch blocks de Server Actions.
- [ ] Configurar alertas para erros críticos no Slack/email do time.

### F6.5 — Sistema de Notificações In-App + Push PWA
- [ ] Tabela `notifications` (profile_id, workspace_id, type, title, content, read_at, created_at).
- [ ] Realtime na tabela `notifications`.
- [ ] Componente `NotificationBell` no header (badge de não lidas + dropdown).
- [ ] Tipos de notificação: novo lead atribuído, mensagem recebida, agendamento próximo, limite de plano.
- [ ] Implementar **Push Notifications nativas do PWA**:
  - Solicitar permissão de notificação ao usuário no primeiro login (desktop/mobile).
  - Gerar `VAPID` keys para Web Push.
  - Criar tabela `push_subscriptions` (profile_id, endpoint, p256dh, auth).
  - Enviar push via `web-push` library quando o usuário receber notificação crítica e estiver offline.
  - Testar recebimento de push no Android Chrome e iOS Safari (iOS 16.4+ suporta PWA push).

---

## 🚀 Fase 7: Escalabilidade, Segurança e Go-Live (Semanas 17-18)

> **Objetivo:** Produção pronta. Performance, segurança e operação contínua.

### F7.1 — Rate Limiting e Segurança
- [ ] Implementar rate limiting em Server Actions e Route Handlers usando `Upstash Redis` + `@upstash/ratelimit`.
- [ ] Proteção contra abuso de webhooks (validar signatures do Stripe, Resend, Meta, Evolution).
- [ ] Content Security Policy (CSP) headers na Vercel.
- [ ] Audit logs: tabela `audit_logs` (workspace_id, actor_id, action, entity_type, entity_id, metadata, created_at).

### F7.2 — Estratégia de Cache
- [ ] Cachear queries pesadas do Kanban e calendário com `TanStack Query` stale-time de 30s.
- [ ] Utilizar `Vercel Edge Config` ou `Upstash Redis` para configurações globais (planos, feature flags).
- [ ] Cache de assets no Cloudflare (configurar como proxy).

### F7.3 — Backup e Disaster Recovery
> Decisão infra: Supabase iniciará no **Free Tier** durante desenvolvimento/homologação. Upgrade para **Pro** obrigatório antes de plugar os primeiros clientes pagantes.

- [ ] Configurar backups diários automáticos do Supabase assim que migrar para o plano Pro (PITR - Point in Time Recovery).
- [ ] Documentar runbook de restore.
- [ ] Exportação de dados por workspace (GDPR/LGPD compliance).
- [ ] Criar checklist de migração Free → Pro: habilitar PITR, aumentar pools de conexão, revisar limites de RLS.

### F7.4 — Performance Audit e Polish Final
- [ ] Rodar Lighthouse em todas as páginas críticas (meta: >90 em todas as métricas).
- [ ] Otimizar bundle size (análise com `@next/bundle-analyzer`).
- [ ] Ajustar LCP e CLS no dashboard e páginas públicas.
- [ ] Revisão final de acessibilidade (ARIA labels, navegação por teclado, contraste de cores).

### F7.5 — Go-Live Checklist
- [ ] Upgrade do Supabase Free Tier → Pro concluído.
- [ ] Domínio customizado configurado na Vercel (`app.synapze.io`).
- [ ] DNS e SSL via Cloudflare.
- [ ] Variáveis de ambiente de produção revisadas e seguras.
- [ ] Documentação interna do time (README técnico, runbooks).
- [ ] Treinamento white-glove do primeiro cliente piloto.

---

## ❓ Perguntas Estratégicas Pendentes

Antes de darmo o **start oficial** na Fase 0, preciso da sua validação (ou direcionamento) sobre os seguintes pontos:

### 1. LLM Provider para IA e Embeddings
> Qual será o provider padrão para embeddings e sumários? Recomendo **OpenAI** (`text-embedding-3-small` + `gpt-4o-mini` para sumários) pelo custo-benefício, mas se houver preferência por **Google (Gemini)** ou outro modelo barato local (K2.5/MiMo), preciso ajustar as dimensões do vetor e a arquitetura da fila.

### 2. App Mobile / PWA
> O MVP precisa ser apenas **web responsivo**, ou você deseja investir em **PWA** (instalável, push notifications, offline básico) já nas primeiras semanas? Isso impacta a estrutura de Service Workers e notificações push.

### 3. Testes E2E desde o Início
> Recomendo testes E2E com Playwright cobrindo os fluxos críticos (login, criar contato, mover card no Kanban). Devemos escrever esses testes **paralelamente ao desenvolvimento** (cultura de qualidade) ou podemos adiar para uma **sprint de QA dedicada** após a Fase 6?

### 4. Orçamento de Infraestrutura Inicial
> A Hostinger VPS intermediária suportará quantas instâncias Evolution simultâneas? E o plano do Supabase: estamos no **Pro** (necessário para PITR e maior throughput) ou começaremos no **Free Tier** e escalamos? Isso define se pgvector terá limitações de performance logo de cara.

---

## 📎 Anexos Recomendados (a serem criados durante o projeto)

1. **`TECH_DECISIONS.md`** — Registro de ADRs (Architecture Decision Records).
2. **`DB_SCHEMA.md`** — Diagrama ER atualizado (pode ser gerado via dbdocs.io ou PlantUML).
3. **`API_CONTRACT.md`** — Contrato dos Server Actions e Webhooks.
4. **`DEPLOYMENT.md`** — Guia passo-a-passo de deploy na Vercel e Hostinger.
5. **`SECURITY.md`** — Políticas de RLS, rate limits, e responsabilidades.

---

**Próximo passo:** Valide as perguntas acima e aprovaremos este plano para iniciarmos a execução semanal.
