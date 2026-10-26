# Plan: BUG-11 — La subida de fotos no valida antes de subir

- **Ítem del backlog**: BUG-11
- **Autor**: Agente · **Fecha**: 2026-10-26 · **Estado**: Aprobado (plan nocturno del Sprint 2, autorizado por el dev)
- **Rama**: `fix/bug-11-validar-fotos`

## Objetivo

Confirmar que la subida de fotos que reescribió T-12 cumple los tres CA y cerrar el ítem. Si falta una prueba, se
agrega; no se cambia código de producción.

## Qué ya hace T-12

| CA | Dónde se cumple | Test |
|---|---|---|
| CA-1: gusto inexistente, tipo no permitido o archivo grande se rechazan sin llamar a Cloudinary | `uploadMenuPhotoSchema` (JPG, PNG o WEBP en base64, hasta 5 MB) en la acción y `findById` antes de `uploadImage` en `menu-photo.service.ts` | `catalog.test.ts`, `menu-photo.service.test.ts` y el contrato nuevo |
| CA-2: si falla el guardado, la imagen se borra | `catch` con `deleteImage` en `menu-photo.service.ts` | `menu-photo.service.test.ts` |
| CA-3: subir y borrar quedan en la auditoría | `audit` con "Foto agregada" y "Foto eliminada" | `menu-photo.service.test.ts` |

## Cambio

- Contrato nuevo `upload-menu-photo.contract.test.ts`: un gusto inexistente, un GIF, una URL y más de 5 MB devuelven
  su error y **no llaman** a `cloudinaryService.uploadImage`. El contrato de hoy probaba el tipo, pero no el tamaño ni
  que Cloudinary quedara sin tocar.

## Pregunta abierta

"¿Qué tamaño máximo y qué formatos se aceptan?" queda con **JPG, PNG o WEBP de hasta 5 MB**, lo vigente desde T-12.
Es una decisión provisoria (D-5 de `sprint-2.md`): cambiarla es tocar `PHOTO_MAX_BYTES` y `DATA_URL` en
`menu-photo.schema.ts`, y el texto del botón en `menu-photos-modal.tsx`.
