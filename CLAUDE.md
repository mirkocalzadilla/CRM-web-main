# CLAUDE.md — Frontend Conventions

Guidance for Claude Code (and any dev) working on the frontend. **Read before touching code.** Front spec: [`docs/FRONTEND_SPEC.md`](docs/FRONTEND_SPEC.md). El diseño canónico del agente vive en el repo **server** (`server/docs/`).

## Commands

Package manager is **pnpm** (`npx pnpm`).

- `npx pnpm dev` — start Next.js dev server
- `npx pnpm build` — production build (strict type checking)
- `npx pnpm lint` — ESLint
- `npx pnpm tsc --noEmit` — strict type checking

## Architecture & Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** Tailwind CSS v4 + shadcn/ui + Lucide icons
- **State:** Zustand (UI global) · React Query (server state) · Axios · Zod

## Paradigm / invariants (front) — NO romper sin actualizar el diseño primero

- La app es el **CRM/Inbox del staff** (en `/crm`) + la landing pública (`mirkocalzadilla.com`). Sin subdominio `app.` (el CRM vive en `/crm`, sin routing por hostname).
- **Inbox + takeover:** lista de conversaciones + hilo; toggle **IA on/off** por conversación (`is_ai_active`); badge 🔥 cuando `handed_off`.
- **Pipeline "Gestión Postventa"** (kanban, `kind: 'human'`): los leads derivados entran acá; acción `/generarEntrada` al validar el pago. Se llamaba "Gestión Humana" hasta el rename de 2026-08-30 (server 0035): el nombre describía al ejecutor, y la validación del pago y la entrega pasaron a ser automáticas. El primer pipeline (`kind: 'ia'`) es **"Gestión Venta"**. **El front nunca rutea por el nombre del pipeline** — usa `kind` y `status_code`.
- **Config del agente (ABM): solo `platform_operator`** (Natalia + equipo, p. ej. Chris) — prompt, nivel de emojis (mucho/poco/nada), temperatura. El **cliente (`client_admin` = Mirko) y el `staff` NO** lo ven. **Users/roles: operador o `client_admin`** — el cliente gestiona su propio staff dentro de su tenant (`canManageUsers` ≠ `canManageConfig`, split #126 / server #200). RBAC de 3 niveles, ver `server/docs/SPECS_MVP.md` §RBAC.
- **Realtime:** mensajes nuevos llegan por WebSocket/SSE propio alimentado desde Redis Pub/Sub del backend — **NO** socket.io de terceros.
- Contratos con el backend: `server/docs/SPECS_MVP.md`.

## Clean Code Rules

- **Clean code siempre.** TypeScript estricto: sin `any`/implicit `any`; evitar `as` salvo que sea imprescindible.
- **Tamaño:** componentes <200 líneas; extraé hooks para lógica compleja.
- **Estilo:** `cn()` (`lib/utils.ts`) para merge de clases. Dark mode por defecto (`dark bg-black`), acentos violeta/fucsia.
- **Pruebas end-to-end / por módulo antes de dar por terminado un cambio — no romper lo existente.** Hasta integrar con el backend: trabajar contra stubs/mocks de la API, pruebas locales con la estructura correcta.
- **Idioma:** código en **inglés**; **comentarios mínimos, solo cuando sean necesarios, en inglés**; **UI copy (cliente boliviano) y documentación en español**.

## Antes de commitear

Usá **`/close`**: muestra el diff, lo verifica contra `docs/FRONTEND_SPEC.md` + estas reglas, registra la entrada directamente en `BITACORA.md` (arriba de todo; los conflictos entre PRs se auto-resuelven vía `merge=union` en `.gitattributes`), corre `pnpm lint`/`tsc`/`build` y arma el commit. **No se commitea contra el diseño.**

## Project Structure

- `app/` — rutas (App Router). `components/` — UI (primitivos en `components/ui/`). `hooks/` — hooks. `lib/` — utils, Axios. `store/` — Zustand.
- `docs/` — `FRONTEND_SPEC.md`, `CONTEXT.md`, `archive/`. `BITACORA.md` — registro de cambios.
