# Contexto Global — Frontend Web

Documento de referencia con información que NO se deriva del código: variables de entorno, deuda técnica conocida, y contratos con el backend.

---

## Variables de entorno

| Variable | Default | Producción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | `https://api.mirkocalzadilla.com/api/v1` |

Si `NEXT_PUBLIC_API_URL` no se setea, el cliente Axios (`lib/api/client.ts`) cae al default de localhost.

---

## Endpoints del backend integrados

| Método | Path | Request | Response |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | `{ email, password }` | `TokenResponse { access_token, token_type, expires_in }` |
| `POST` | `/api/v1/auth/register` | `{ email, password, full_name?, tenant_name, tenant_slug }` | `TokenResponse` |
| `GET` | `/api/v1/auth/me` | `Authorization: Bearer <token>` | `{ user, tenant, role: 'owner' \| 'admin' \| 'member' }` |

Validación con Zod en `lib/api/auth.ts` (schemas + tipos derivados con `z.infer`).

---

## Auth — decisiones clave

- **Token persistido en `localStorage`** (clave `mirko-auth`), solo el `access_token`. `user`/`tenant`/`role` se re-fetchean al hidratar vía `/auth/me`.
- **401 en background:** response interceptor limpia el store y hace `window.location.assign('/login')`.
- **`AuthGuard`** (`components/auth/auth-guard.tsx`) protege rutas privadas. Mientras `!hasHydrated || isLoading` muestra spinner; si no hay token, redirige a `/login`.
- **Refresh tokens:** NO implementados. Cuando el JWT expira, el usuario es expulsado a `/login`. Evaluar en fase posterior si conviene `POST /auth/refresh`.

---

## Deuda técnica conocida

### Conflicto visual en `/crm`
`app/crm/page.tsx` renderiza `<CrmPipeline />` (`components/crm-pipeline.tsx`), que trae su propio `<header>` y div de fondo con blobs violet/fuchsia. El layout (`app/crm/layout.tsx`) también provee header y fondo → en `/crm` se ven **dos topbars y dos capas de blobs superpuestas**. Las rutas hijas (`/crm/inbox`, etc.) no tienen el problema.

**Fix recomendado:** quitar el `<header>` y div de fondo de `components/crm-pipeline.tsx`. El kanban + chat se quedan tal cual.

### Magic link sin UI
El backend ya expone `POST /auth/magic-link/{request,consume}` pero no hay UI. Pendiente:
- Botón "Iniciar con magic link" en `/login`
- Ruta `/login/magic/[token]/page.tsx` que consuma el endpoint

### Seguridad del token
Persistencia en `localStorage` deja el token expuesto a XSS. Si en algún momento se requiere mayor seguridad, migrar a httpOnly cookie servida por un endpoint proxy `/auth/session`.

---

## Convenciones de UI

- **Dark mode forzado:** `<html className="dark bg-black">` en `app/layout.tsx`. No hay theme toggle.
- **Favicons light/dark:** responden a `prefers-color-scheme` del SO del usuario, no a un toggle de la app.
- **Acentos:** `violet-500` / `fuchsia-500`.
- **Toaster:** Sonner montado en root layout con `richColors` y `position="top-right"`.
