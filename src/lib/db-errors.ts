import { MESSAGES } from '@/config/messages';

const { DATABASE } = MESSAGES.ERROR;
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

export function handleDatabaseError(error: unknown, entityName: string): string {
  const facts = factsOf(error);
  if (isForeignKey(facts)) {
    return facts.detail.includes('is still referenced') ? DATABASE.FOREIGN_KEY_VIOLATION : DATABASE.RELATION_NOT_FOUND;
  }
  if (isUnique(facts) || facts.name === 'DuplicateEntityError') return DATABASE.UNIQUE_VIOLATION;
  if (facts.message.includes('failed query') || facts.name === 'ConcurrencyError') return DATABASE.CONCURRENCY;
  return text(error, 'message') || DATABASE.GENERIC(entityName);
}
