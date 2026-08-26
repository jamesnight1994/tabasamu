export class AdminApiError extends Error {
  readonly status?: number;

  constructor(message: string, options?: { status?: number }) {
    super(message);
    this.name = 'AdminApiError';
    this.status = options?.status;
  }
}

export const isAdminApiError = (error: unknown): error is AdminApiError =>
  error instanceof AdminApiError;
