# Converxa — Planning

> Development board for the Converxa MVP. Each ticket covers DB + Backend + Frontend.
> Update status as work progresses.

## Status legend

| Badge | Meaning |
|-------|---------|
| `⬜ TODO` | Not started |
| `🟡 IN PROGRESS` | Currently being worked on |
| `✅ DONE` | Completed and verified |

---

## Frontend conventions

### Architecture: feature-based

All domain logic lives inside `features/`. Pages in `app/` are thin — only receive params and compose layouts.

```
src/
├── app/                     Next.js App Router — pages only, no logic
├── features/                one folder per domain
│   ├── auth/
│   │   ├── components/      LoginForm, RegisterForm
│   │   ├── hooks/           useLogin, useRegister
│   │   ├── api/             auth.api.ts  ← axios calls
│   │   ├── store/           auth.store.ts  ← zustand
│   │   └── types/           auth.types.ts
│   ├── flows/               FlowCard, FlowEditor, nodes/
│   ├── conversations/
│   ├── leads/
│   ├── faqs/
│   ├── analytics/
│   ├── billing/
│   ├── whatsapp/
│   └── superadmin/
├── components/
│   ├── ui/                  shadcn primitives (never modified directly)
│   ├── layout/              Sidebar, Topbar, DashboardLayout, AuthLayout
│   └── shared/              DataTable, StatusBadge, EmptyState, PageHeader, ConfirmDialog
└── lib/
    ├── axios.ts             single configured instance: baseURL, token injection, 401 → refresh → retry
    ├── query-client.ts      TanStack Query config
    └── utils.ts
```

**Rules:**
- Pages call feature hooks — never call `axios` directly from a page
- Shared components live in `components/shared/` — never copy-paste across features
- Server state → TanStack Query. UI-only state → Zustand. Forms → react-hook-form + Zod

### HTTP client: Axios

Single instance in `lib/axios.ts`. Interceptors handle:
1. Inject `Authorization` header from cookie/store
2. On 401 → silent token refresh → retry original request

### Design system

Eco-friendly / biophilic aesthetic. NOT the typical blue/purple SaaS palette.

| Role | Color |
|------|-------|
| Primary | Deep greens `#1a3c2e → #40916c → #74c69d` |
| Accent | Earth tones `#6b4226 → #a07855 → #d4a373` |
| Background | Warm off-whites `#fefae0, #f8f4e8` |
| Neutrals | Warm grays (not cool) |

Visual style: soft rounded corners, organic shapes, nature-inspired iconography, biophilic textures as subtle backgrounds.
shadcn/ui components customized via Tailwind CSS v4 CSS variables.

---

## Epics

| Epic | Tickets |
|------|---------|
| E1 · Foundation | T-01 |
| E2 · Authentication | T-02 |
| E3 · Tenants | T-03, T-04 |
| E4 · WhatsApp | T-05 |
| E5 · Flows Builder | T-06, T-07, T-08 |
| E6 · FAQs | T-09 |
| E7 · Bot Engine | T-10, T-11 |
| E8 · Conversations | T-12, T-13 |
| E9 · Leads | T-14 |
| E10 · Analytics | T-15 |
| E11 · Dashboard Home | T-16 |
| E12 · Billing | T-17, T-18, T-19 |
| E13 · SuperAdmin | T-20 |

---

## E1 · Foundation

### T-01 · Infrastructure setup `⬜ TODO`

Levanta el ambiente de desarrollo y la base de datos con todas las tablas, RLS e índices.

#### DB
- [ ] Configurar TypeORM DataSource (`DATABASE_URL` desde env)
- [ ] Crear todas las tablas: `tenants`, `tenant_settings`, `users`, `refresh_tokens`, `payments`, `flows`, `blocks`, `block_options`, `wa_sessions`, `conversations`, `conversation_messages`, `leads`
- [ ] Habilitar RLS en cada tabla de dominio
- [ ] Política `tenant_isolation` en cada tabla (con `bypass_rls` para SuperAdmin)
- [ ] Índices: conversaciones por phone/state/last_activity, blocks GIN keywords, leads por status, payments por tenant

#### Backend
- [ ] Estructura de carpetas del módulo `shared/` (database, guards, filters, pipes, decorators)
- [ ] `TenantContextInterceptor` (envuelve cada request en una transaction con `SET LOCAL`)
- [ ] `GlobalExceptionFilter` con Sentry
- [ ] `ZodValidationPipe` global
- [ ] Health check: `GET /api/v1/health` (verifica DB, Redis, OpenWA)
- [ ] Configurar Pino con redacción de PII
- [ ] Validar variables de entorno con Zod en el boot
- [ ] Script de migrations (`migrations:run`, `migrations:generate`)
- [ ] Conectar Redis (BullMQ y cache)

#### Frontend
- [ ] Instalar dependencias UI: shadcn/ui, Radix UI, TanStack Query, Zustand, react-hook-form, Zod
- [ ] Configurar TanStack Query provider en el root layout
- [ ] Crear layout base (auth / dashboard / superadmin)

#### Acceptance criteria
- [ ] `docker compose -f docker/docker-compose.dev.yml up` levanta Postgres, Redis, MinIO y Mailhog sin errores
- [ ] `bun run --filter @converxa/api start:dev` arranca sin errores de config
- [ ] `GET /api/v1/health` responde `{ status: "ok" }` con DB y Redis conectados
- [ ] Un insert y read en `blocks` con tenant_id distinto al seteado en la sesión devuelve 0 registros (RLS funcionando)

#### Tests
- [ ] Integration: RLS bloquea lectura cross-tenant en tabla `blocks`
- [ ] Integration: `SET LOCAL` se limpia al finalizar la transacción (no hay leakage entre requests)

---

## E2 · Authentication

### T-02 · Registration, login and JWT `⬜ TODO`

Registro de nuevos tenants (crea usuario + tenant en una transacción), login con JWT RS256, refresh y logout.

#### DB
- [ ] Tabla `users` (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
- [ ] Tabla `refresh_tokens` (id, user_id, token_hash, expires_at, revoked_at)
- [ ] Tabla `tenants` (id, name, slug, owner_user_id, status, trial_ends_at, paid_until)
- [ ] Tabla `tenant_settings` (id, tenant_id, timezone, handoff_timeout_minutes, main_menu_message)

#### Backend
- [ ] Módulo `auth`: `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`
- [ ] Entidades TypeORM: `User`, `RefreshToken`
- [ ] `POST /api/v1/auth/register` — crea tenant + TenantOwner en una transacción, inicia trial de 14 días
- [ ] `POST /api/v1/auth/login` — verifica password (Argon2id), firma access token RS256 (15m) y refresh token (7d), persiste hash del refresh en DB
- [ ] `POST /api/v1/auth/refresh` — rota el access token; invalida el refresh anterior
- [ ] `POST /api/v1/auth/logout` — revoca el refresh token
- [ ] `JwtAuthGuard`, `RolesGuard`, decoradores `@CurrentUser`, `@Roles`, `@Public`
- [ ] Rate limiting en `/auth/login` y `/auth/register` (5 req/min por IP con `@nestjs/throttler`)
- [ ] Headers de seguridad con `helmet()`

#### Frontend
- [ ] Página `/login` (email + password, submit, manejo de errores)
- [ ] Página `/register` (nombre, apellido, email, password, empresa)
- [ ] Token JWT en cookie HTTPOnly vía endpoint del backend (`/auth/set-cookie`)
- [ ] Middleware Next.js que protege las rutas `(dashboard)` y `(superadmin)`: si no hay token → `/login`
- [ ] Refresh automático del access token al recibir 401

#### Acceptance criteria
- [ ] Registro crea usuario con role `TENANT_OWNER` y tenant con status `trial`, `trial_ends_at = now + 14 días`
- [ ] Login devuelve `{ accessToken, refreshToken, user }` con password correcto
- [ ] Login devuelve 401 con password incorrecto
- [ ] Ruta `/dashboard` redirige a `/login` sin token válido
- [ ] Ruta `/dashboard` accesible con token válido
- [ ] SuperAdmin con `role = SUPER_ADMIN` puede acceder a `/(superadmin)`, otros roles reciben 403

#### Tests
- [ ] Unit: `AuthService.register` crea tenant + user en transacción
- [ ] Unit: `AuthService.login` verifica contraseña con Argon2id; falla devuelve `UnauthorizedException`
- [ ] Unit: `AuthService.refresh` invalida token previo
- [ ] Unit: `RolesGuard` bloquea role insuficiente

---

## E3 · Tenants

### T-03 · Tenant profile and settings `⬜ TODO`

Configuración del tenant: datos de la empresa, zona horaria, timeout de handoff.

#### DB
- [ ] Tabla `tenant_settings` (ya definida en T-02)

#### Backend
- [ ] Módulo `tenants`: controller, service, repository
- [ ] Entidades TypeORM: `Tenant`, `TenantSettings`
- [ ] `GET /api/v1/tenants/me/settings` — devuelve configuración del tenant autenticado
- [ ] `PATCH /api/v1/tenants/me/settings` — actualiza timezone, handoff_timeout_minutes, main_menu_message
- [ ] `GET /api/v1/tenants/:id` — SuperAdmin: detalle de tenant

#### Frontend
- [ ] Página `/settings` (nombre empresa, timezone, mensaje del menú principal, timeout handoff)
- [ ] Formulario con react-hook-form + Zod, submit con optimistic update via TanStack Query

#### Acceptance criteria
- [ ] TenantOwner puede editar la configuración de su propio tenant
- [ ] TenantOwner no puede editar configuración de otro tenant (RLS lo bloquea)
- [ ] SuperAdmin puede ver configuración de cualquier tenant

#### Tests
- [ ] Unit: `TenantsService.updateSettings` rechaza si `tenantId` no coincide con el del JWT
- [ ] Integration: RLS impide que un tenant lea `tenant_settings` de otro

---

### T-04 · User management within tenant `⬜ TODO`

TenantOwner invita a agentes y viewers, cambia roles y desactiva usuarios.

#### DB
- [ ] Tabla `users` (ya creada en T-02)

#### Backend
- [ ] `POST /api/v1/auth/invite` — TenantOwner invita a un Agent/Viewer (envía email con link de activación)
- [ ] `GET /api/v1/users` — lista usuarios del tenant autenticado
- [ ] `PATCH /api/v1/users/:id` — actualizar role o is_active
- [ ] EmailPort + SmtpAdapter para envío del invitation email (Mailhog en dev)

#### Frontend
- [ ] Página `/users` (tabla: nombre, email, rol, estado activo)
- [ ] Modal "Invite user" (email, rol: Agent o Viewer)
- [ ] Inline toggle de activo/inactivo
- [ ] Badge de rol editable (TenantOwner puede cambiar Agent ↔ Viewer)

#### Acceptance criteria
- [ ] Invitación envía email en dev (visible en Mailhog `http://localhost:8025`)
- [ ] Solo TenantOwner puede invitar usuarios (Agent y Viewer reciben 403)
- [ ] Usuario desactivado recibe 401 al intentar login
- [ ] Un tenant no puede ver ni modificar usuarios de otro tenant

#### Tests
- [ ] Unit: `AuthService.invite` genera token de invitación y llama a EmailPort
- [ ] Unit: desactivar usuario revoca refresh tokens activos

---

## E4 · WhatsApp

### T-05 · WhatsApp session and QR `⬜ TODO`

Conectar el número de WhatsApp del tenant escaneando un QR desde el panel.

#### DB
- [ ] Tabla `wa_sessions` (id, tenant_id, openwa_session_id, status, qr_code, connected_at, last_activity_at)

#### Backend
- [ ] Módulo `messaging`: controller, service, repository
- [ ] Entidad TypeORM: `WaSession`
- [ ] `MessagingPort` interface + `OpenWaAdapter` (llamadas HTTP a OpenWA)
- [ ] `POST /api/v1/messaging/sessions` — crea sesión en OpenWA y persiste en `wa_sessions`
- [ ] `GET /api/v1/messaging/sessions/me` — devuelve status y qr_code del tenant
- [ ] `POST /api/v1/messaging/sessions/me/reconnect` — reconecta sesión desconectada
- [ ] `POST /api/v1/webhooks/openwa` — webhook público; valida firma HMAC-SHA256; encola en `webhook-process`
- [ ] `WebhookProcessWorker`: consume cola y actualiza `wa_sessions` en evento `session.status`
- [ ] BullMQ setup: colas `webhook-process` y `whatsapp-send`

#### Frontend
- [ ] Página `/settings/whatsapp` (estado de sesión: badge "Conectado / Esperando QR / Desconectado")
- [ ] Si status es `pending_qr`: mostrar imagen QR con polling cada 5 segundos
- [ ] Cuando status cambia a `connected`: ocultar QR, mostrar número conectado y fecha
- [ ] Botón "Reconectar" si status es `disconnected`

#### Acceptance criteria
- [ ] QR se muestra al abrir la pantalla por primera vez
- [ ] QR se actualiza cuando OpenWA emite nuevo `session.status` con nuevo qr_code
- [ ] Cuando el usuario escanea, el frontend detecta `connected` en el siguiente polling (≤ 5 s)
- [ ] Webhook de OpenWA devuelve 200 inmediatamente (no espera el procesamiento)
- [ ] Webhook con firma inválida devuelve 401

#### Tests
- [ ] Unit: `OpenWaAdapter` lanza error si OpenWA responde 4xx
- [ ] Unit: webhook controller rechaza firma HMAC inválida
- [ ] Integration: evento `session.status: connected` actualiza `wa_sessions.status`

---

## E5 · Flows Builder

### T-06 · Flow CRUD `⬜ TODO`

Crear, listar, duplicar y eliminar flujos. Gestión del ciclo de vida draft/active.

#### DB
- [ ] Tabla `flows` (id, tenant_id, name, description, version, is_active, is_draft, entry_block_id)

#### Backend
- [ ] Módulo `flows`: controller, service, repository
- [ ] Entidad TypeORM: `Flow`
- [ ] `GET /api/v1/flows` — lista flujos del tenant
- [ ] `POST /api/v1/flows` — crea flujo en estado draft
- [ ] `PUT /api/v1/flows/:id` — actualiza nombre/descripción del borrador
- [ ] `DELETE /api/v1/flows/:id` — soft delete (no borra si is_active)
- [ ] `POST /api/v1/flows/:id/duplicate` — duplica flujo completo (con bloques)

#### Frontend
- [ ] Página `/flows` (grid o tabla de flujos: nombre, versión, estado draft/active, acciones)
- [ ] Botón "New flow" → modal con nombre y descripción → redirige al editor
- [ ] Badge de estado: "Draft" | "Active"
- [ ] Menú de acciones: editar, duplicar, eliminar

#### Acceptance criteria
- [ ] Flujo nuevo siempre empieza con `is_draft: true`, `is_active: false`
- [ ] No se puede eliminar un flujo activo
- [ ] Duplicar crea un nuevo flujo con todos los bloques y `is_active: false`
- [ ] Tenant B no puede ver ni modificar flujos de Tenant A

#### Tests
- [ ] Unit: `FlowsService.delete` lanza error si el flujo tiene `is_active: true`
- [ ] Unit: `FlowsService.duplicate` copia todos los bloques y block_options
- [ ] Integration: RLS impide que un tenant lea flows de otro

---

### T-07 · Visual flow editor `⬜ TODO`

Editor drag-and-drop con React Flow: 4 tipos de nodos, panel de propiedades, autosave y validación.

#### DB
- [ ] Tabla `blocks` (id, tenant_id, flow_id, type, message, save_as, validation_schema, next_block_id, is_faq, keywords, hits)
- [ ] Tabla `block_options` (id, block_id, tenant_id, label, next_block_id, order_index)

#### Backend
- [ ] Entidades TypeORM: `Block`, `BlockOption`
- [ ] `GET /api/v1/flows/:flowId/blocks` — devuelve bloques + opciones del flujo
- [ ] `POST /api/v1/flows/:flowId/blocks` — crea un bloque
- [ ] `PUT /api/v1/flows/:flowId/blocks/:id` — actualiza bloque (autosave solo sobre draft)
- [ ] `DELETE /api/v1/flows/:flowId/blocks/:id` — elimina bloque
- [ ] `GET /api/v1/flows/:id/validate` — DFS: detecta ciclos y bloques inalcanzables

#### Frontend
- [ ] Instalar React Flow 11 en `@converxa/web`
- [ ] Página `/flows/[id]/edit` con canvas React Flow
- [ ] Nodos custom: `MessageNode`, `QuestionNode`, `MenuNode`, `HandoffNode`
- [ ] Panel lateral de propiedades al seleccionar un nodo (editar mensaje, opciones, save_as, keywords)
- [ ] Autosave con debounce 2 s: llama a `PUT /blocks/:id` solo sobre el borrador
- [ ] Validación visual: ciclos en rojo, nodos inalcanzables con opacidad reducida
- [ ] Botón "Validate" muestra lista de errores en un panel inferior

#### Acceptance criteria
- [ ] Drag de un nodo al canvas lo crea en DB
- [ ] Conectar dos nodos setea `next_block_id`
- [ ] Autosave no dispara si no hubo cambios en los últimos 2 s
- [ ] Validate retorna error si hay ciclo entre bloques
- [ ] Validate retorna warning si hay bloque inalcanzable

#### Tests
- [ ] Unit: algoritmo DFS detecta ciclo en grafo de bloques
- [ ] Unit: algoritmo DFS detecta nodo inalcanzable
- [ ] Unit: `BlocksService.create` asigna `tenant_id` desde JWT, no del input

---

### T-08 · Flow publish/unpublish `⬜ TODO`

Publicar un flujo convierte el borrador en activo. El bot solo usa flujos activos.

#### DB
- [ ] `flows.is_active`, `flows.is_draft`, `flows.version` (ya en T-06)

#### Backend
- [ ] `POST /api/v1/flows/:id/publish` — valida el flujo (no tiene ciclos), copia draft → active, incrementa `version`, setea `is_active: true`
- [ ] `POST /api/v1/flows/:id/unpublish` — setea `is_active: false`

#### Frontend
- [ ] Botón "Publish" en el editor de flujos
- [ ] Si hay errores de validación → no se puede publicar, se muestran los errores
- [ ] Badge actualizado en la lista de flujos al publicar
- [ ] Botón "Unpublish" en el editor cuando el flujo está activo

#### Acceptance criteria
- [ ] Publicar un flujo con ciclos devuelve 422 con detalle del error
- [ ] Publicar un flujo válido incrementa `version` y setea `is_active: true`
- [ ] El bot solo responde con flujos que tienen `is_active: true`
- [ ] El autosave solo modifica el borrador, nunca el flujo publicado

#### Tests
- [ ] Unit: `FlowsService.publish` rechaza flujo con ciclos
- [ ] Unit: `FlowsService.publish` incrementa versión correctamente

---

## E6 · FAQs

### T-09 · FAQ management `⬜ TODO`

FAQs son bloques con `is_faq = true`. Gestión desde un panel dedicado.

#### DB
- [ ] Tabla `blocks` con columnas `is_faq` y `keywords` text[] (ya en T-07)
- [ ] Índice GIN sobre `keywords` para búsqueda eficiente

#### Backend
- [ ] `GET /api/v1/faqs` — lista bloques con `is_faq = true` del tenant
- [ ] `POST /api/v1/faqs` — crea bloque FAQ (message, keywords[])
- [ ] `PUT /api/v1/faqs/:id` — edita mensaje y keywords
- [ ] `DELETE /api/v1/faqs/:id` — elimina FAQ

#### Frontend
- [ ] Página `/faqs` (tabla: pregunta/mensaje, keywords chips, hits)
- [ ] Botón "New FAQ" → modal (mensaje de respuesta, campo de keywords con chip input)
- [ ] Edición inline o con modal
- [ ] Columna "Hits" (cuántas veces fue consultada) — solo lectura

#### Acceptance criteria
- [ ] FAQ creada tiene `is_faq: true` y pertenece al tenant autenticado
- [ ] Keywords se guardan como array PostgreSQL
- [ ] Hits incrementan cuando el motor conversacional usa esa FAQ

#### Tests
- [ ] Unit: `FaqsService.findMatchingFaq` normaliza input (lowercase, sin acentos) antes de comparar
- [ ] Unit: si múltiples FAQs coinciden, gana la de más keywords en común

---

## E7 · Bot Engine

### T-10 · Conversational engine `⬜ TODO`

Motor que procesa mensajes entrantes: ejecuta flujos, FAQs, handoff y captura de leads.

#### DB
- [ ] Tabla `conversations` (id, tenant_id, contact_phone, wa_session_id, current_block_id, flow_id, state, assigned_agent_id, context JSONB, started_at, last_activity_at, closed_at)
- [ ] Tabla `conversation_messages` (id, tenant_id, conversation_id, role, content, message_type, sent_at)

#### Backend
- [ ] Entidades TypeORM: `Conversation`, `ConversationMessage`
- [ ] `WebhookProcessWorker`: consume cola `webhook-process`; extrae `tenantId` desde `sessionId`; llama al motor
- [ ] `ConversationEngine.handleMessage()`: implementa el algoritmo de 8 pasos (ver `tecnica_converxa.md §11.3`)
  - [ ] findOrCreateConversation
  - [ ] Redis SETNX lock (`conv:{id}:lock`, TTL 10s)
  - [ ] Human mode: reenviar al agente
  - [ ] Continuar flujo: avanzar bloque según input
  - [ ] Sin flujo: keyword matching (GIN) → FAQ o menú principal
  - [ ] Ejecutar bloque: MESSAGE / QUESTION / MENU / HANDOFF
  - [ ] Persistir estado de conversación
  - [ ] Liberar lock
- [ ] `renderTemplate()`: reemplaza `{{variable}}` desde `conversation.context`
- [ ] Bloque QUESTION: validación de tipo (email, phone, text, number); máx 3 reintentos → handoff
- [ ] Bloque HANDOFF: setea estado `pending_handoff`, crea lead si no existe
- [ ] Keyword normalizer: lowercase, sin acentos, trim

#### Frontend
- No aplica (procesamiento en background)

#### Acceptance criteria
- [ ] Mensaje a tenant suspendido no genera respuesta
- [ ] Mensaje en conversación `human_mode` no es procesado por el bot
- [ ] Dos mensajes simultáneos del mismo usuario: el segundo se reencola con 500ms de delay
- [ ] Bloque QUESTION re-pregunta si el input no pasa validación; al 3er fallo va a handoff
- [ ] `{{nombre}}` en un mensaje se reemplaza con el valor capturado en el contexto

#### Tests
- [ ] Unit: motor devuelve menú principal cuando no hay keyword match
- [ ] Unit: motor avanza al `next_block_id` después de un bloque MESSAGE
- [ ] Unit: bloque QUESTION falla 3 veces → deriva a handoff
- [ ] Unit: `renderTemplate` reemplaza variables correctamente
- [ ] Integration: mensaje completo desde webhook → respuesta encolada en `whatsapp-send`

---

### T-11 · WhatsApp message sending `⬜ TODO`

Worker que envía mensajes a OpenWA con reintentos y backoff exponencial.

#### Backend
- [ ] `WhatsAppSendWorker`: consume cola `whatsapp-send`; llama a `MessagingPort.sendText` o `sendButtons`
- [ ] BullMQ retry: 5 intentos, delays: 5s / 30s / 2m / 10m / 30m
- [ ] `OpenWaAdapter.sendText()` y `sendButtons()`: llamadas HTTP a OpenWA con API key

#### Tests
- [ ] Unit: worker llama a `MessagingPort.sendText` con los datos del job
- [ ] Unit: si OpenWA falla, BullMQ reintenta con backoff

---

## E8 · Conversations

### T-12 · Conversations inbox `⬜ TODO`

Bandeja de conversaciones del tenant con filtros, detalle y asignación.

#### Backend
- [ ] `GET /api/v1/conversations` — lista conversaciones del tenant con filtros: `state`, `assignedAgentId`, paginación
- [ ] `GET /api/v1/conversations/:id` — detalle con mensajes
- [ ] `POST /api/v1/conversations/:id/assign` — asigna agente
- [ ] `POST /api/v1/conversations/:id/close` — cierra conversación

#### Frontend
- [ ] Página `/conversations` (lista: teléfono, estado badge, agente asignado, última actividad)
- [ ] Filtros: por estado (all / active / human_mode / closed), por agente asignado
- [ ] Página `/conversations/[id]` (historial de mensajes con bubbles user/bot/agent, info del contacto, botón asignar/cerrar)

#### Acceptance criteria
- [ ] Solo se muestran conversaciones del tenant autenticado
- [ ] Agente solo ve conversaciones asignadas a sí mismo
- [ ] Cerrar una conversación setea `state: closed` y `closed_at`
- [ ] Conversación `human_mode` aparece resaltada en la lista

#### Tests
- [ ] Unit: `ConversationsService.list` con filtro de estado retorna solo las correspondientes
- [ ] Unit: Agent no puede ver conversaciones de otro agente

---

### T-13 · Human handoff `⬜ TODO`

Transferencia de conversación del bot a un agente humano.

#### Backend
- [ ] Estado `pending_handoff` en `conversations.state` (el motor lo setea, ver T-10)
- [ ] `POST /api/v1/conversations/:id/accept` — Agent acepta la conversación (`pending_handoff` → `human_mode`)
- [ ] Cron `conversation-cleanup` (cada 5 min): cierra conversaciones con `last_activity_at` vencido según `handoff_timeout_minutes`

#### Frontend
- [ ] Badge de notificación en el sidebar cuando hay conversaciones en `pending_handoff`
- [ ] Botón "Accept" en conversaciones en estado `pending_handoff`
- [ ] Cuando está en `human_mode`: input de texto para que el agente responda
- [ ] Respuesta del agente se envía via `POST /api/v1/conversations/:id/message` y se encola en `whatsapp-send`

#### Acceptance criteria
- [ ] Solo un agente puede aceptar la conversación (el primero que acepta la toma)
- [ ] En `human_mode`, el bot no responde aunque lleguen mensajes del usuario
- [ ] Si nadie acepta en `handoff_timeout_minutes`, el bot retoma con mensaje configurable
- [ ] El agente puede cerrar la conversación manualmente

#### Tests
- [ ] Unit: cron de cleanup cierra conversaciones inactivas según timeout del tenant
- [ ] Integration: aceptar conversación cambia estado a `human_mode`

---

## E9 · Leads

### T-14 · Lead capture and management `⬜ TODO`

Leads capturados por el bot; gestión de estado y asignación desde el dashboard.

#### DB
- [ ] Tabla `leads` (id, tenant_id, name, email, phone, status, assigned_agent_id, conversation_id, custom_fields JSONB)

#### Backend
- [ ] Entidad TypeORM: `Lead`
- [ ] Lead creado automáticamente por el motor al completar un bloque HANDOFF o al capturar suficientes datos en bloques QUESTION
- [ ] `GET /api/v1/leads` — lista leads del tenant con filtros: `status`, `assignedAgentId`, paginación
- [ ] `PATCH /api/v1/leads/:id` — actualiza status o assigned_agent_id

#### Frontend
- [ ] Página `/leads` (tabla: nombre, teléfono, email, estado badge, agente asignado, fecha)
- [ ] Filtro por estado: `new`, `contacted`, `qualified`, `lost`, `won`
- [ ] Cambio de estado inline (dropdown)
- [ ] Asignación de agente inline

#### Acceptance criteria
- [ ] Lead se crea automáticamente cuando el motor ejecuta un bloque HANDOFF
- [ ] Lead tiene link a la conversación de origen
- [ ] Agent solo ve leads asignados a sí mismo
- [ ] Tenant B no puede ver leads de Tenant A

#### Tests
- [ ] Unit: motor crea lead con datos del contexto al llegar a bloque HANDOFF
- [ ] Integration: RLS impide que un tenant lea leads de otro

---

## E10 · Analytics

### T-15 · Dashboard metrics `⬜ TODO`

Métricas básicas accionables para el TenantOwner.

#### Backend
- [ ] `GET /api/v1/analytics/summary` — devuelve:
  - Conversaciones iniciadas por día (últimos 30 días)
  - Top 5 FAQs más consultadas (por hits)
  - Leads por estado (conteo)
  - Tasa de derivación (% conversaciones que llegaron a HANDOFF)

#### Frontend
- [ ] Página `/analytics`:
  - 4 cards: total conversaciones, leads nuevos, tasa de derivación, FAQs consultadas
  - Gráfico de línea: conversaciones por día (con recharts o similar)
  - Tabla: top FAQs (keyword + hits)
  - Donut: leads por estado

#### Acceptance criteria
- [ ] Métricas son exclusivas del tenant autenticado (RLS)
- [ ] Período por defecto: últimos 30 días
- [ ] Página carga en < 1.5 s

#### Tests
- [ ] Unit: `AnalyticsService.getSummary` agrupa conversaciones por día correctamente

---

## E11 · Dashboard Home

### T-16 · Dashboard overview `⬜ TODO`

Página de inicio del dashboard: resumen del estado actual.

#### Frontend
- [ ] Página `/dashboard` (home):
  - Conversaciones activas ahora (badge con conteo)
  - Leads nuevos hoy
  - Estado de la sesión WhatsApp (badge: conectado / desconectado)
  - Últimas 5 conversaciones activas (link a cada una)
  - Últimos 5 leads (link a cada uno)
  - Quick actions: "Go to flows", "Connect WhatsApp"

#### Acceptance criteria
- [ ] Los datos se cargan con TanStack Query con un `staleTime` de 30 s
- [ ] Badge de sesión WA es visible y refleja el estado real del tenant

---

## E12 · Billing

### T-17 · MercadoPago payment `⬜ TODO`

Pago online via MercadoPago Checkout Pro: generación de link y confirmación por webhook.

#### DB
- [ ] Tabla `payments` (id, tenant_id, amount_cents, currency, method, status, external_ref, notes, paid_at, confirmed_at, confirmed_by)

#### Backend
- [ ] Entidad TypeORM: `Payment`
- [ ] `POST /api/v1/billing/checkout` — SuperAdmin genera link de Checkout Pro para un tenant; crea `Payment` en status `pending`
- [ ] `POST /api/v1/billing/webhooks/mercadopago` — webhook público; verifica firma MP; si pago aprobado: actualiza `payment.status = confirmed`, `tenant.paid_until += 30 días`, activa el tenant si suspendido

#### Frontend
- [ ] Página `/settings/billing`:
  - Estado del plan: activo / trial (días restantes) / suspendido
  - `paid_until` visible
  - Botón "Pay with MercadoPago" → redirige al link de Checkout Pro
  - Historial de pagos

#### Acceptance criteria
- [ ] Webhook con firma MP inválida devuelve 401
- [ ] Pago aprobado por MP: `paid_until` se extiende 30 días y tenant pasa a `active`
- [ ] Pago duplicado no actualiza `paid_until` dos veces (idempotencia por `external_ref`)

#### Tests
- [ ] Unit: `BillingService.handlePaymentUpdate` actualiza `paid_until` exactamente 30 días
- [ ] Unit: pago duplicado (mismo `external_ref`) no actualiza dos veces

---

### T-18 · Bank transfer manual confirmation `⬜ TODO`

SuperAdmin confirma manualmente pagos por transferencia bancaria.

#### Backend
- [ ] `POST /api/v1/tenants/:id/payments` — SuperAdmin registra pago manual: `{ method: "bank_transfer", amountCents, notes }` → crea `Payment` confirmado, extiende `paid_until`, activa si suspendido

#### Frontend
- [ ] En la vista de detalle del tenant (SuperAdmin): formulario "Confirm payment" (monto, notas, referencia de transferencia)
- [ ] Historial de pagos del tenant con method badge (MP / bank transfer)

#### Acceptance criteria
- [ ] Solo SuperAdmin puede confirmar pagos (`SUPER_ADMIN` role requerido)
- [ ] Confirmar pago actualiza `paid_until` y activa el tenant si estaba suspendido
- [ ] El pago queda registrado con `confirmed_by` (id del SuperAdmin que lo confirmó)

#### Tests
- [ ] Unit: `TenantsService.confirmPayment` requiere `SUPER_ADMIN`; devuelve 403 con otro rol

---

### T-19 · Tenant expiry cron `⬜ TODO`

Suspensión automática de tenants con `paid_until` o `trial_ends_at` vencido.

#### Backend
- [ ] `CronService.tenantExpiryCheck` — diario a las 02:00 UTC:
  - Busca tenants con `paid_until < now()` y status `active` → suspende
  - Busca tenants con `trial_ends_at < now()` y status `trial` → suspende
- [ ] `CronService.trialReminder` — diario a las 09:00 UTC:
  - Tenants en día 12 de trial → envía email (EmailPort)
- [ ] `CronService.conversationCleanup` — cada 5 min:
  - Cierra conversaciones con `last_activity_at + handoff_timeout_minutes < now()`
- [ ] Bot responde con mensaje de servicio suspendido si tenant status es `suspended`

#### Acceptance criteria
- [ ] Tenant con `paid_until` vencido es suspendido automáticamente al día siguiente
- [ ] Bot no responde mensajes de tenant `suspended`
- [ ] Email de reminder llega en día 12 (visible en Mailhog en dev)

#### Tests
- [ ] Unit: `CronService.tenantExpiryCheck` suspende solo los tenants con fecha vencida
- [ ] Unit: bot devuelve mensaje de suspensión para tenant con status `suspended`

---

## E13 · SuperAdmin

### T-20 · SuperAdmin panel `⬜ TODO`

Panel del owner: lista de tenants, acciones de activar/suspender y detalle.

#### Backend
- [ ] `GET /api/v1/tenants` — lista todos los tenants con status, paid_until, trial_ends_at (solo SUPER_ADMIN)
- [ ] `POST /api/v1/tenants/:id/activate` — activa tenant suspendido
- [ ] `POST /api/v1/tenants/:id/suspend` — suspende tenant activo
- [ ] Todos estos endpoints usan `bypass_rls = 'on'` via `TenantContextInterceptor`

#### Frontend
- [ ] Layout `(superadmin)` protegido: redirige a `/login` si el role no es `SUPER_ADMIN`
- [ ] Página `/superadmin` (overview: total tenants activos, en trial, suspendidos, ingresos del mes)
- [ ] Página `/superadmin/tenants` (tabla: nombre, email owner, status badge, paid_until, acciones)
- [ ] Acciones de tabla: activar, suspender, ver detalle
- [ ] Página `/superadmin/tenants/[id]` (detalle completo: datos, historial de pagos, estado WA, formulario confirmar pago manual — de T-18)

#### Acceptance criteria
- [ ] TenantOwner que intenta acceder a `/superadmin` es redirigido a `/dashboard`
- [ ] SuperAdmin puede activar y suspender cualquier tenant
- [ ] SuperAdmin puede ver historial de pagos de cualquier tenant
- [ ] RLS bypass permite a SuperAdmin leer datos de cualquier tenant sin errores

#### Tests
- [ ] Unit: `TenantsService.list` sin SUPER_ADMIN devuelve 403
- [ ] Integration: SuperAdmin puede leer tenants con `bypass_rls = 'on'`

---

## Dependency order

```
T-01 (Foundation)
  └── T-02 (Auth)
        ├── T-03 (Tenant settings)
        │     └── T-04 (User management)
        └── T-05 (WhatsApp)
              ├── T-06 (Flow CRUD)
              │     ├── T-07 (Flow editor)
              │     │     └── T-08 (Publish)
              │     └── T-09 (FAQs)
              └── T-10 (Bot engine) ← depends on T-07, T-09
                    ├── T-11 (Message sending)
                    ├── T-12 (Conversations)
                    │     └── T-13 (Handoff)
                    └── T-14 (Leads)
                          ├── T-15 (Analytics)
                          ├── T-16 (Dashboard home)
                          ├── T-17 (MercadoPago)
                          ├── T-18 (Bank transfer)
                          ├── T-19 (Expiry cron)
                          └── T-20 (SuperAdmin panel)
```
