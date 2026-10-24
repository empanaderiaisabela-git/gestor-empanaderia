import type { ActionFailure } from './action-result';
import { AppError, type ErrorCode, errorMessage } from './errors';

const FOREIGN_KEY = '23503';
const UNIQUE = '23505';

type ErrorFacts = { code: string; detail: string; message: string; name: string };

function property(source: unknown, key: string): unknown {
  return typeof source === 'object' && source !== null ? Reflect.get(source, key) : undefined;
}

function text(source: unknown, key: string): string {
  const value = property(source, key);
  return typeof value === 'string' ? value : '';
}

function factsOf(error: unknown): ErrorFacts {
  const sources = [error, property(error, 'originalError'), property(error, 'cause')];
  const first = (key: string): string => sources.map((source) => text(source, key)).find(Boolean) ?? '';
  return {
    code: first('code'),
    detail: first('detail').toLowerCase(),
    message: sources.map((source) => text(source, 'message')).join(' ').toLowerCase(),
    name: text(error, 'name'),
  };
}

function isForeignKey({ code, detail, message }: ErrorFacts): boolean {
  return code === FOREIGN_KEY || message.includes('foreign key') || detail.includes('foreign key');
}

function isUnique({ code, message }: ErrorFacts): boolean {
  return code === UNIQUE || message.includes('unique constraint') || message.includes('already exists');
}

export function databaseErrorCode(error: unknown): ErrorCode | null {
  if (error instanceof AppError) return error.code;
  const facts = factsOf(error);
  if (isForeignKey(facts)) return facts.detail.includes('is still referenced') ? 'HAS_RELATIONS' : 'RELATION_NOT_FOUND';
  if (isUnique(facts) || facts.name === 'DuplicateEntityError') return 'DUPLICATE';
  if (facts.message.includes('failed query') || facts.name === 'ConcurrencyError') return 'STALE_VERSION';
  return null;
}

export function handleDatabaseError(error: unknown, entityName: string): string {
  if (error instanceof AppError) return error.message;
  const code = databaseErrorCode(error);
  if (code !== null) return errorMessage(code, entityName);
  return text(error, 'message') || errorMessage('UNEXPECTED', entityName);
}

export function toActionFailure(error: unknown, entityName: string): ActionFailure {
  if (error instanceof AppError) return { success: false, code: error.code, error: error.message };
  const code = databaseErrorCode(error) ?? 'UNEXPECTED';
  return { success: false, code, error: errorMessage(code, entityName) };
}
