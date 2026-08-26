const AUTH_FAILURE_DETAIL =
  /token(?:\s+(?:has|is))?\s+expired|token\s+is\s+invalid|invalid\s+token|not valid for any token type|given token not valid|token_not_valid|token_expired|authentication credentials were not provided/i;

export const looksLikeAuthFailureMessage = (message: string): boolean => {
  const normalized = message.trim();
  if (!normalized) return false;
  return AUTH_FAILURE_DETAIL.test(normalized);
};

const collectResponseText = (data: unknown): string[] => {
  const parts: string[] = [];

  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      parts.push(value.trim());
    }
  };

  if (typeof data === 'string') {
    push(data);
    return parts;
  }

  if (!data || typeof data !== 'object') return parts;

  const record = data as Record<string, unknown>;

  push(record.detail);
  push(record.message);
  push(record.error);
  push(record.code);

  if (Array.isArray(record.detail)) {
    for (const item of record.detail) {
      if (typeof item === 'string') {
        push(item);
      } else if (item && typeof item === 'object' && 'message' in item) {
        push((item as Record<string, unknown>).message);
      }
    }
  }

  if (Array.isArray(record.messages)) {
    for (const item of record.messages) {
      if (typeof item === 'string') {
        push(item);
      } else if (item && typeof item === 'object' && 'message' in item) {
        push((item as Record<string, unknown>).message);
      }
    }
  }

  return parts;
};

const readResponsePayload = (data: unknown): string => {
  const parts = collectResponseText(data);
  if (parts.length > 0) {
    return parts.find((text) => !/^token_not_valid$/i.test(text)) ?? parts[0];
  }
  return '';
};

const isTokenAuthFailurePayload = (data: unknown): boolean => {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  if (record?.code === 'token_not_valid') return true;
  return collectResponseText(data).some((text) => looksLikeAuthFailureMessage(text));
};

export const isAuthExpiredError = (error: unknown): boolean => {
  const axiosError = error as {
    response?: { status?: number; data?: unknown };
    message?: string;
  };
  const status = axiosError?.response?.status;
  const payload = axiosError?.response?.data;
  const extractedMessage = readResponsePayload(payload);
  const tokenPayloadMatch = isTokenAuthFailurePayload(payload);
  const extractedMessageMatch = looksLikeAuthFailureMessage(extractedMessage);
  const messageMatch =
    !axiosError?.response &&
    !!axiosError?.message &&
    looksLikeAuthFailureMessage(axiosError.message);

  if (status === 401) return true;
  if (status === 403 && (tokenPayloadMatch || extractedMessageMatch)) return true;
  if (messageMatch) return true;
  return false;
};

const readAxiosError = (error: unknown) =>
  error as {
    response?: { data?: unknown; status?: number };
    message?: string;
  };

export const getApiErrorStatus = (error: unknown): number | undefined =>
  readAxiosError(error).response?.status;

export const isProductSlugConflictError = (error: unknown): boolean => {
  const status = getApiErrorStatus(error);
  if (status !== 409) return false;

  const message = extractApiErrorMessage(error, '');
  return /slug already exists/i.test(message);
};

export const extractApiErrorMessage = (error: unknown, fallback = 'Request failed'): string => {
  const axiosError = readAxiosError(error);

  const fromResponse = readResponsePayload(axiosError?.response?.data);
  if (fromResponse) return fromResponse;

  if (error instanceof Error && error.message && error.message !== 'Network Error') {
    return error.message;
  }

  if (axiosError?.message) return axiosError.message;

  return fallback;
};
