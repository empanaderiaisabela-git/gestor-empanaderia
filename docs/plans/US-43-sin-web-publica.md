# Plan: US-43 — Sin web pública por ahora: se entra por `/login`

- **Ítem del backlog**: US-43
- **Autor**: Agente · **Fecha**: 2026-10-30 · **Estado**: Aprobado
- **Rama**: `feat/us-43-sin-web-publica`
- **Nivel de tests**: 2 · lógica acotada (toca `proxy.ts`)

## Objetivo

La rotisería todavía no va a usar la web pública. El dev quiere desplegar en Vercel sólo la gestión, con `/login`
como entrada, y poder prender la web más adelante sin tocar código.

## Descubrimiento (respuestas)

| Pregunta | Respuesta | Fuente |
|---|---|---|
| ¿Qué se apaga? | Todo lo público: `/home`, `/product/<id>` y `/api/public` | Dev, 2026-10-30 |
| ¿Cómo se apaga y se prende? | Con la variable `PUBLIC_CATALOG`. Apagada salvo `true`. Para prenderla, se carga en Vercel y se redespliega | Dev pidió "deployo y no se ve"; el valor por defecto lo eligió el agente (D-1) |
| ¿Adónde va quien entra sin sesión? | A `/login`, también la raíz del dominio y una sesión inválida | Dev |
| ¿Y con sesión? | Igual que hoy: el admin puede abrir `/home` como vista previa y el vendedor va a su inicio | Agente |

**Preguntas abiertas**: ninguna.

## Cambios por capa

| Capa | Archivos | Responsabilidad |
|---|---|---|
| lib | `src/lib/public-catalog.ts` (nuevo) | `isCatalogPublic()`: `PUBLIC_CATALOG === 'true'`, leída en cada request |
| lib | `src/lib/catalog-cache.ts` | Con la web apagada, `revalidateCatalog()` no regenera `/home` (no gasta ISR Writes) |
| `proxy.ts` | `src/proxy.ts` | `PUBLIC_PATHS` (siempre) y `CATALOG_PATHS` (sólo con la web prendida). La entrada sin sesión es `/home` o `/login` según el interruptor |
| config | `.env.example`, `.env.test` | La variable documentada; los E2E corren con la web prendida |

Sin cambios de base de datos ni de errores.

## Tests

| Tipo | Casos |
|---|---|
| Unit (`proxy.test.ts`) | Con la variable vacía, sin cargar o en `false`: `/`, `/ventas`, `/home`, `/product/x` y `/api/public/x` llevan a `/login`; `/login` pasa; la sesión inválida se borra y lleva a `/login`; con sesión, el admin abre `/home` y el vendedor va a `/ventas`. Los tests de antes, con la web prendida |
| Unit (`catalog-cache.test.ts`) | Con la web apagada, no se llama a `revalidatePath` |
| Contrato | Los de `menu-catalog` y `stock-pricing` siguen verificando la regeneración con la web prendida |
| E2E | `landing`, `navegacion` y el smoke de `auth.setup` con la web prendida (`.env.test`). La web apagada la cubren los tests del proxy: un E2E necesitaría un segundo servidor |

## Riesgos y decisiones

- **D-1 · Apagada por defecto.**
  - Pregunta: si la variable no está cargada, ¿la web queda prendida o apagada?
  - Situación: el dev no entendió la pregunta y esperaba que, al desplegar, la web no se viera.
  - Elegido: apagada salvo `PUBLIC_CATALOG=true`. Desplegar sin tocar Vercel deja la web oculta.
  - Qué cambia si se elige al revés: habría que cargar `PUBLIC_CATALOG=false` en Vercel y, si alguien se olvida, la
    web se ve.
  - Efecto en la PC del dev: sin la variable en `.env.local`, la web local también queda apagada, y la raíz abre
    `/login`.
- **D-2 · El admin con sesión ve `/home`.** Sirve como vista previa de la web antes de prenderla. No expone nada nuevo:
  el catálogo es información pública.
- `proxy.ts` es una barrera de navegación, no de seguridad. Con la web apagada, las lecturas públicas del catálogo
  (`fetchCatalog`, `fetchCatalogItem`) siguen respondiendo si alguien las llama directo. Sólo devuelven lo que la web
  mostraría.
- Para que Vercel lo tome, el cambio tiene que llegar a la rama que despliega Vercel (`main`), con el OK del dev.
