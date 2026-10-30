/**
 * Centralized messages for the application.
 * This includes success messages, validation errors, and system errors.
 */
const sentence = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const MESSAGES = {
  SUCCESS: {
    CREATED: (entity: string) => `Se registró ${entity}`,
    UPDATED: (entity: string) => `Se actualizó ${entity}`,
    DELETED: (entity: string) => `Se eliminó ${entity}`,
    ACTIVATED: (entity: string) => `Se activó ${entity}`,
    DEACTIVATED: (entity: string) => `Se desactivó ${entity}`,
    REACTIVATED: (entity: string) => `Se reactivó ${entity} que ya existía, con los datos nuevos`,
  },
  ERROR: {
    VALIDATION: {
      INVALID_DATA: 'Los datos proporcionados no son válidos.',
      REQUIRED_FIELD: 'Este campo es obligatorio.',
      INVALID_FORMAT: (field: string) => `El formato del campo ${field} no es válido.`,
    },
    DATABASE: {
      UNIQUE_VIOLATION: 'Ya existe un registro con esos datos (DNI, nombre o código duplicado).',
      FOREIGN_KEY_VIOLATION: 'No se puede completar la operación porque existen registros relacionados.',
      NOT_FOUND: (entity: string) => `${sentence(entity)} ya no existe.`,
      CONCURRENCY: 'Otro usuario cambió estos datos. Ya se actualizaron; intentá de nuevo.',
      GENERIC: (entity: string) => `Ocurrió un error inesperado al procesar ${entity}.`,
      RELATION_NOT_FOUND: 'Una de las entidades relacionadas ya no existe.',
    },
    AUTH: {
      UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
      INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos.',
      SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    },
    GENERIC: 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
  },
} as const;
