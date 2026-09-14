---
description: Cierre pre-commit (frontend) — valida diff contra el diseño, registra en BITACORA, crea branch, pushea y abre PR a main
---

Ejecutá el cierre pre-commit de este repo (frontend). Seguí los pasos EN ORDEN. No saltear ninguno.

## 1. Diff

Mostrá `git status --short`, `git diff` y `git diff --staged`. Listá los archivos modificados/nuevos/borrados.

## 2. Resumen del cambio

En 2–4 líneas: qué cambió y por qué. Incluí el módulo/página afectada.

## 3. Clasificación del cambio

Determiná el tipo para el nombre del branch:
- `feat/` — funcionalidad nueva (inbox, pipeline, ABM de agente, takeover)
- `fix/` — corrección de bug
- `docs/` — solo documentación
- `chore/` — config, CI, dependencias, housekeeping

Formá el nombre: `<tipo>/<slug-del-cambio>-YYYYMMDD` (ej. `feat/inbox-takeover-20260605`).

## 4. Verificación contra el paradigma — STOP si hay desviación

Leé `CLAUDE.md` + `docs/FRONTEND_SPEC.md`. Verificá que el cambio respeta **todos** estos invariantes:

| Invariante | Qué verificar |
|---|---|
| CRM en `/crm` | sin subdominio separado; todo el CRM bajo la ruta `/crm` |
| Takeover | toggle `is_ai_active` implementado en el inbox (no workarounds) |
| Pipeline | kanban llamado "Gestión Postventa" (`kind: 'human'`), columnas alineadas con los stages del funnel |
| Config del agente | endpoints de config solo visibles para rol `admin`; el `staff` NO los ve |
| Realtime | WebSocket/SSE propio (NO socket.io ni librerías de terceros para realtime) |
| TypeScript estricto | cero `any` explícito |
| Tamaño | componentes <200 líneas |
| Idioma UI | copy en español; código y comentarios en inglés (mínimos) |
| Dark mode | paleta violeta/fucsia definida en el diseño |

**Si el cambio DESVÍA de alguno de estos puntos:**
- **DETENÉ aquí.**
- Explicá exactamente qué invariante rompe y por qué.
- Si es una mejora intencional: primero actualizar `docs/FRONTEND_SPEC.md` y acordarlo. **No commitear contra el diseño.**
- Si es un refactor que mejora el flujo sin romper el paradigma: apuntalo en la bitácora (paso 5) con el contexto "por qué" y "qué spec respeta".

## 5. Tests — no commitear si falla

Corré en orden:

```bash
npx pnpm lint
npx pnpm tsc --noEmit
npx pnpm build
```

Reportá los resultados reales (output). Si algo falla: **no continuar**, corregir primero.

Si el cambio depende del backend y este aún no está integrado: validá contra stubs/mocks y mencionalo explícitamente.

## 6. Bitácora

Agregá la entrada **directamente en `BITACORA.md`**, arriba de todo bajo `## Entradas` (la más nueva primero), con este formato exacto:

```
### YYYY-MM-DD · <autor> · <módulo/página>
- Qué cambió:
- Por qué:
- Spec/decisión que respeta:   (ref a FRONTEND_SPEC / server/docs/SPECS_MVP)
- Prueba local:
- Commit:   (completar después del commit)
```

Editá `BITACORA.md` directo sin miedo a conflictos: `.gitattributes` marca `BITACORA.md merge=union`, así que si otro PR agrega una entrada en paralelo, git conserva las dos automáticamente al mergear. (Ya no se usan fragmentos en `.bitacora/` ni el bot que pusheaba a main.)

Si el cambio incluye una mejora de flujo (refactor consensuado, extensión de un módulo): agregá:
```
- Mejora de flujo: <descripción — qué mejoró y por qué es coherente con el diseño>
```

## 7. Branch + commit

1. Creá el branch: `git checkout -b <nombre-del-branch>` (del paso 3).
2. Stagea los archivos relevantes (**no `git add .` ciego** — asegurándote de incluir `BITACORA.md` con tu entrada, y de excluir `.next/`, `node_modules/`, `.env.local`).
3. Armá el commit. Mostrámelo **antes de ejecutarlo** para confirmación.
   - Formato: `<tipo>(<módulo>): <descripción corta en inglés>` (ej. `feat(crm): add inbox with AI takeover toggle`)
   - Autora = la usuaria del repo. **Sin co-author.**

Esperá confirmación antes de ejecutar el commit.

## 8. Push + PR

Después de confirmar el commit:

1. `git push origin <nombre-del-branch>`
2. Crear PR a `main`:
   ```bash
   gh pr create \
     --base main \
     --title "<tipo>(<módulo>): <descripción>" \
     --body "$(cat <<'EOF'
   ## Qué cambia
   <resumen del paso 2>

   ## Módulo / página
   <módulo o ruta afectada>

   ## Spec que respeta
   <referencia al FRONTEND_SPEC o SPECS_MVP del server>

   ## Tests
   <resultado de lint/tsc/build del paso 5>
   EOF
   )"
   ```
3. Mostrá la URL del PR.

## 9. Completar la bitácora

Volvé a `BITACORA.md` y completá el campo `Commit:` con el hash del commit creado.

$ARGUMENTS
