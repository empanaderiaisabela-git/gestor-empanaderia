import { type ErrorCode, errorMessage } from './codes';

type AppErrorOptions = {
  entity?: string;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, { entity, cause }: AppErrorOptions = {}) {
    super(errorMessage(code, entity), { cause });
    this.name = 'AppError';
    this.code = code;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
