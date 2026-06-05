# Converxa — Documento de Producto

> **Nombre del producto:** Converxa (nombre provisional).
> **Tipo de documento:** Especificación funcional.
> **Audiencia:** Producto, operaciones, dirección, perfiles no técnicos.
> **Versión:** 2.0 — Simplificado para desarrollo individual.
> **Estado:** Aprobado.

---

## 1. Resumen Ejecutivo

**Converxa** es una plataforma **SaaS multi-tenant** que permite a empresas de cualquier rubro automatizar la **atención inicial por WhatsApp Business** mediante un chatbot configurable, sin necesidad de programar.

El dueño de la plataforma (owner) revende el servicio a sus clientes. Cada cliente (tenant) accede a su propio panel donde configura flujos de conversación, conecta su número de WhatsApp, gestiona leads y visualiza métricas. El owner tiene su propio panel para gestionar clientes, pagos y estado general de la plataforma.

Converxa **no reemplaza al vendedor humano**: automatiza el primer contacto, responde preguntas frecuentes, captura leads y deriva a un asesor cuando corresponde.

---

## 2. Visión del Producto

Ser la herramienta de referencia en Hispanoamérica para que empresas de cualquier rubro (automotor, gastronomía, salud, educación, inmobiliarias, servicios) automaticen su primer contacto en WhatsApp de forma simple y accesible.

**Pilares:**

1. **Configurable, no programable.** Un usuario no técnico diseña flujos, carga FAQs y gestiona leads sin escribir código.
2. **Humano en el centro.** El bot filtra y captura; la derivación a humano es una capacidad de primera clase.
3. **Datos del cliente, para el cliente.** Cada tenant es dueño de su información. No se mezclan datos entre clientes.

---

## 3. Descripción del Sistema

| Componente | Descripción |
|---|---|
| **Dashboard del cliente** | App web donde el cliente configura su bot, diseña flujos, ve leads y métricas. |
| **Panel del owner** | App web del dueño de la plataforma: gestión de clientes, pagos, estado de sesiones. |
| **API Backend** | API REST con toda la lógica de negocio: motor conversacional, tenants, leads, auth. |
| **Base de datos** | PostgreSQL como sistema de persistencia principal. |
| **Cache y colas** | Redis para cache y cola de mensajes salientes (BullMQ). |
| **OpenWA** | Gateway HTTP REST de WhatsApp desplegado como servicio independiente (sidecar). |

**Flujo simplificado de un mensaje entrante:**

```
[Cliente escribe al WhatsApp de la empresa]
        ↓
[OpenWA recibe el mensaje]
        ↓
[OpenWA dispara webhook a la API]
        ↓
[API identifica al tenant por sessionId]
        ↓
[Motor conversacional evalúa: ¿FAQ? ¿flujo? ¿handoff?]
        ↓
[API responde a OpenWA]
        ↓
[OpenWA envía la respuesta al cliente por WhatsApp]
```

---

## 4. Objetivos

### De producto

1. Permitir a un cliente nuevo configurar su cuenta, conectar su WhatsApp y tener un bot respondiendo en menos de 30 minutos, sin asistencia técnica.
2. Ofrecer un editor visual de flujos que permita diseñar, validar y publicar un flujo sin escribir código.
3. Garantizar que un lead capturado llegue al asesor con todo el contexto de la conversación.
4. Proveer métricas básicas accionables: conversaciones, FAQs consultadas, leads capturados, derivaciones.

### De negocio

1. Validar el modelo con los primeros clientes beta antes del lanzamiento público.
2. Lograr un ingreso mensual recurrente estable en los primeros 6 meses.
3. Mantener churn bajo mediante onboarding guiado y soporte activo.

---

## 5. Alcance

### 5.1 Incluido en el MVP

- Atención automatizada por WhatsApp:
  - Reconocimiento de palabras clave → respuesta FAQ.
  - Flujos conversacionales guiados (menús con botones, preguntas con captura de datos).
- Captura de leads con campos personalizables.
- Derivación a asesor humano (handoff).
- Dashboard del cliente:
  - Editor visual de flujos.
  - Gestión de FAQs.
  - Bandeja de conversaciones.
  - Bandeja de leads.
  - Métricas básicas.
  - Gestión de usuarios del tenant (Owner, Agent, Viewer).
  - Configuración y conexión de WhatsApp.
- Panel del owner:
  - Lista de clientes (tenants) con estado y fecha de vencimiento.
  - Confirmación manual de pagos (transferencia bancaria).
  - Registro de pagos con MercadoPago.
  - Activar / suspender tenants.
- Multi-tenancy con aislamiento de datos por tenant.
- Autenticación con email y contraseña (JWT + refresh token).
- 4 roles: Owner de plataforma (SuperAdmin), TenantOwner, Agent, Viewer.
- Un plan de servicio único.
- Trial gratuito de 14 días.

### 5.2 Fuera de alcance del MVP

- **Inteligencia Artificial / RAG** — fase futura.
- **Envío outbound / campañas masivas** — fase futura.
- **Multi-idioma** — el MVP es 100% en español.
- **Webchat, Instagram, Telegram** — fase futura.
- **Múltiples planes de precios** — fase futura. Hoy hay uno solo.
- **Subscripciones automáticas recurrentes** — el cobro es manual en el MVP.
- **SSO / 2FA** — fase futura.
- **App móvil nativa** — el dashboard es web responsive.
- **White-label para agencias** — fase futura.
- **Export a CSV** — fase futura.
- **Categorías de FAQs** — fase futura.
- **Impersonación de SuperAdmin** — fase futura.
- **Integraciones externas (CRM, calendarios, etc.)** — fase futura.

---

## 6. Actores y Roles

### Actores externos

| Actor | Descripción |
|---|---|
| **Usuario final** | Persona que escribe al WhatsApp de un cliente. No tiene cuenta en Converxa. |
| **Cliente (Tenant)** | Empresa que contrata el servicio. Accede al dashboard para configurar su bot. |
| **Asesor humano** | Persona del equipo del cliente que recibe derivaciones. Accede con rol Agent. |
| **MercadoPago** | Procesador de pagos para cobros online. |

### Roles internos

| Rol | Descripción |
|---|---|
| **SuperAdmin** | Dueño de la plataforma. Acceso global: gestiona tenants, confirma pagos, ve todo. |
| **TenantOwner** | Dueño de la cuenta de un cliente. Acceso total dentro de su tenant. |
| **Agent** | Asesor que recibe leads y conversaciones derivadas. Permisos limitados. |
| **Viewer** | Solo lectura: puede ver métricas, conversaciones y leads, no modificar nada. |

### Matriz de permisos

| Acción | SuperAdmin | TenantOwner | Agent | Viewer |
|---|---|---|---|---|
| Gestionar tenants | ✅ | ❌ | ❌ | ❌ |
| Confirmar pagos | ✅ | ❌ | ❌ | ❌ |
| Conectar WhatsApp | ✅ | ✅ | ❌ | ❌ |
| Diseñar flujos y FAQs | ✅ | ✅ | ❌ | ❌ |
| Ver conversaciones | ✅ | ✅ | ✅ (asignadas) | ✅ |
| Responder conversaciones | ✅ | ✅ | ✅ (asignadas) | ❌ |
| Gestionar leads | ✅ | ✅ | ✅ (asignados) | ✅ (lectura) |
| Invitar usuarios | ✅ | ✅ | ❌ | ❌ |
| Ver métricas | ✅ | ✅ | ✅ (propias) | ✅ |

---

## 7. Casos de Uso Principales

### UC-01: Onboarding de un nuevo cliente

1. El cliente se registra con email y contraseña.
2. Confirma su email.
3. Ingresa los datos de su empresa (nombre, rubro).
4. Conecta su WhatsApp escaneando un QR desde la sección de configuración.
5. Crea su primer flujo conversacional.
6. Publica el bot.
7. Comienza a recibir conversaciones.

**Resultado:** Bot activo respondiendo en WhatsApp.

### UC-02: Diseñar un flujo conversacional

1. El TenantOwner accede al editor visual.
2. Crea un flujo nuevo o duplica uno existente.
3. Agrega bloques: mensaje, pregunta, menú u opciones, handoff.
4. Configura cada bloque (texto, opciones, próximo bloque).
5. Valida el flujo (el sistema detecta ciclos y bloques inalcanzables).
6. Publica el flujo.

**Resultado:** Flujo validado y activo.

### UC-03: Conversación automática

1. El usuario final escribe al WhatsApp del cliente.
2. OpenWA recibe el mensaje y llama al webhook.
3. El motor conversacional evalúa:
   - ¿Está en un flujo activo? → continúa el flujo.
   - ¿Hay una FAQ que coincida? → responde la FAQ.
   - ¿Pidió hablar con una persona? → deriva.
   - ¿No se reconoce la intención? → muestra el menú principal.
4. Se envía la respuesta al usuario.
5. Se persiste la conversación.

**Resultado:** Usuario recibe respuesta, conversación queda registrada.

### UC-04: Captura de un lead

1. El bot solicita datos al usuario (nombre, teléfono, email, interés).
2. Valida cada campo.
3. Guarda el lead asociado al tenant.
4. Notifica al dashboard (polling o WebSocket básico).
5. Asigna el lead a un Agent disponible.

**Resultado:** Lead capturado y asignado.

### UC-05: Derivación a humano (handoff)

1. El usuario escribe "hablar con alguien", "asesor" o el bot no puede resolver.
2. El bot confirma la derivación y marca la conversación como `pending_handoff`.
3. Un Agent acepta la conversación desde el dashboard.
4. En modo humano, el bot no interviene.
5. Si nadie acepta en el tiempo configurado, el bot retoma con un mensaje.

**Resultado:** Conversación transferida a humano o retornada al bot.

### UC-06: Gestión de pagos (SuperAdmin)

1. El cliente paga via MercadoPago o transferencia bancaria.
2. Si es MercadoPago: el webhook confirma el pago automáticamente.
3. Si es transferencia: el cliente envía comprobante, el SuperAdmin lo confirma manualmente.
4. El sistema actualiza `paid_until` del tenant.
5. Un cron diario verifica vencimientos y suspende tenants con `paid_until` vencido.

**Resultado:** Tenant activo con fecha de vencimiento actualizada.

---

## 8. Funcionalidades del MVP

### 8.1 Atención automatizada por WhatsApp

- Reconocimiento de palabras clave con normalización (lowercase, sin acentos).
- Respuestas con texto plano o botones (quick replies).
- Variables de contexto en mensajes (`{{nombre}}`, `{{email}}`).
- Cola de envío con reintentos ante fallos de OpenWA.

### 8.2 Flujos guiados

- Tipos de bloque: `MESSAGE`, `QUESTION`, `MENU`, `HANDOFF`.
- Validación de grafo (DFS): detecta ciclos y bloques inalcanzables.
- Vista previa del flujo.
- Publicación del flujo (borrador → publicado).

### 8.3 Captura de leads

- Campos personalizables por flujo.
- Validación básica por tipo (email, teléfono, texto).
- Estados del lead: `new`, `contacted`, `qualified`, `lost`, `won`.
- Asignación a Agent.

### 8.4 Derivación a humano

- Trigger: bloque `HANDOFF`, keywords ("humano", "asesor", "persona").
- Timeout configurable: si nadie acepta en N minutos, el bot retoma.
- En modo humano, el bot no interviene.

### 8.5 Dashboard del cliente

- **Inicio:** resumen con conversaciones activas y leads recientes.
- **Conexión WhatsApp:** estado de sesión y QR.
- **Editor de flujos:** editor visual con drag-and-drop.
- **FAQs:** alta, baja y edición.
- **Conversaciones:** bandeja con filtros y asignación.
- **Leads:** listado, estado y asignación.
- **Usuarios:** invitar y gestionar roles.
- **Métricas:** conversaciones, leads, FAQs más consultadas, tasa de derivación.
- **Configuración:** datos del tenant, zona horaria.

### 8.6 Panel del owner (SuperAdmin)

- Lista de todos los tenants con estado (activo, trial, suspendido).
- Fecha de vencimiento de cada tenant (`paid_until`).
- Confirmación manual de pagos por transferencia bancaria.
- Registro automático de pagos via webhook de MercadoPago.
- Activar / suspender tenants manualmente.

### 8.7 Métricas básicas

- Conversaciones iniciadas (total y por día).
- FAQs más consultadas.
- Leads capturados por estado.
- Tasa de derivación.

---

## 9. Modelo de Monetización

### Plan único — Servicio básico

- **Precio:** a definir por el owner según su mercado.
- **Trial:** 14 días gratuitos desde el registro.
- **Métodos de pago:** MercadoPago (online) o transferencia bancaria (manual).
- **Sin subscripciones automáticas:** el cobro es manual en el MVP. El owner confirma cada pago.
- **Ciclo:** mensual. El sistema guarda `paid_until`; al vencer, el tenant se suspende automáticamente.
- **Múltiples planes:** reservado para una fase futura.

### Flujo de cobro

```
Cliente paga
    ├── Via MercadoPago → webhook activa paid_until
    └── Via transferencia → cliente manda comprobante
                           → SuperAdmin confirma en el panel
                           → sistema actualiza paid_until

Cron diario: si paid_until < hoy → tenant suspendido → bot deja de responder
```

---

## 10. Reglas de Negocio

| # | Regla |
|---|---|
| **RN-01** | Ningún tenant puede ver datos de otro tenant (aislamiento con PostgreSQL RLS). |
| **RN-02** | Cada tenant conecta **una sesión de WhatsApp** en el MVP. |
| **RN-03** | El trial dura 14 días desde el registro. Al vencer sin pago, el tenant pasa a `suspended`. Los datos se conservan 30 días más. |
| **RN-04** | El bot no responde si el tenant está en estado `suspended` o `deleted`. |
| **RN-05** | El tiempo entre mensaje entrante y respuesta saliente no debe superar 3 segundos en condiciones normales. |
| **RN-06** | Si un usuario escribe "STOP" o "BAJA", el bot deja de enviarle mensajes a ese tenant. |
| **RN-07** | El bot no interviene cuando una conversación está en estado `human_mode`. |
| **RN-08** | Los datos de un tenant no se usan para entrenar modelos ni se comparten con terceros. |

---

## 11. Requerimientos No Funcionales Clave

| # | Requerimiento |
|---|---|
| **RNF-01** | Latencia de respuesta del bot < 3 segundos (p95). |
| **RNF-02** | Dashboard cargando en < 1.5 segundos (p99). |
| **RNF-03** | Contraseñas hasheadas con Argon2id. |
| **RNF-04** | Comunicaciones bajo TLS 1.2+. |
| **RNF-05** | Webhooks entrantes de OpenWA validados con firma HMAC-SHA256. |
| **RNF-06** | Tokens JWT con expiración de 15 min. Refresh token de 7 días. |
| **RNF-07** | Secrets nunca en código. Cargados desde variables de entorno validadas en el boot. |
| **RNF-08** | Dashboard responsive: usable desde 1280×720 en desktop y desde 375px en mobile. |
| **RNF-09** | TypeScript strict en todo el código. |
| **RNF-10** | Backups diarios de PostgreSQL con retención de 30 días. |

---

## 12. Riesgos Principales

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | OpenWA deja de mantenerse o se rompe con actualizaciones de WhatsApp. | OpenWA aislado detrás de un puerto `MessagingPort`. Cambio de gateway no toca el dominio. |
| R2 | WhatsApp detecta uso no oficial y banea números de clientes. | Educación al cliente. Rate limiting. En el futuro: migración a WhatsApp Cloud API oficial. |
| R3 | Pérdida de datos por bug. | Backups diarios. Soft delete antes de hard delete. |
| R4 | Churn alto por baja adopción. | Onboarding guiado. Soporte activo en los primeros 14 días. |

---

## 13. Roadmap (Fases)

```
MVP — Fase actual
├── Bot WhatsApp configurable
├── Editor de flujos visual
├── Captura de leads
├── Derivación a humano
├── Dashboard del cliente
├── Panel del owner con gestión de pagos manual
└── Un plan, cobro manual

Fase 2 — Estabilización
├── Mejoras UX basadas en feedback
├── Export a CSV
└── Múltiples planes de precios

Fase 3 — IA conversacional
├── Respuestas basadas en documentos del cliente (RAG)
└── Integración con LLM (OpenAI o Anthropic)

Fase 4 — Escala
├── Outbound / campañas
├── Multi-idioma
├── Integraciones (CRM, calendarios)
└── White-label para agencias
```

---

## 14. Glosario

| Término | Definición |
|---|---|
| **Bot** | Agente conversacional automatizado que responde mensajes en WhatsApp. |
| **Conversación** | Secuencia de mensajes entre un usuario final y el bot (y/o un humano). |
| **FAQ** | Pregunta frecuente con su respuesta, disparable por palabras clave. |
| **Flujo** | Árbol de bloques que define cómo el bot responde a un usuario. |
| **Handoff** | Transferencia de una conversación del bot a un humano. |
| **Lead** | Registro de un usuario final con sus datos de contacto e interés. |
| **OpenWA** | Gateway HTTP de WhatsApp desplegado como servicio independiente. |
| **paid_until** | Fecha hasta la cual el tenant tiene el servicio activo y pago. |
| **SuperAdmin** | Dueño de la plataforma Converxa. Gestiona clientes y pagos. |
| **Tenant** | Cliente de Converxa. Unidad de aislamiento de datos. |
| **Trial** | Período de prueba gratuito de 14 días. |

---

**Fin del documento.**
