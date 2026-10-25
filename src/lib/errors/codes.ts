import { MESSAGES } from '@/config/messages';

const { VALIDATION, DATABASE } = MESSAGES.ERROR;
const DEFAULT_ENTITY = 'registro';

const CATALOG = {
  VALIDATION: () => VALIDATION.INVALID_DATA,
  UNAUTHENTICATED: () => 'No autorizado (Token faltante)',
  SESSION_EXPIRED: () => 'El token es inválido o ha expirado',
  INACTIVE_USER: () => 'Sesión inválida o usuario desactivado. Por favor, cierre sesión y vuelva a entrar.',
  FORBIDDEN: () => 'Solo los administradores pueden realizar esta acción',
  NOT_FOUND: (entity: string) => DATABASE.NOT_FOUND(entity),
  DUPLICATE: () => DATABASE.UNIQUE_VIOLATION,
  HAS_RELATIONS: () => DATABASE.FOREIGN_KEY_VIOLATION,
  RELATION_NOT_FOUND: () => DATABASE.RELATION_NOT_FOUND,
  STALE_VERSION: () => DATABASE.CONCURRENCY,
  INSUFFICIENT_STOCK: (entity: string) => `No hay stock suficiente de ${entity}.`,
  UNEXPECTED: (entity: string) => DATABASE.GENERIC(entity),
} satisfies Record<string, (entity: string) => string>;

export type ErrorCode = keyof typeof CATALOG;

export function errorMessage(code: ErrorCode, entity: string = DEFAULT_ENTITY): string {
  return CATALOG[code](entity);
}
