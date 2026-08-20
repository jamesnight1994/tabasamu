import { isAdminApiError } from './admin-api-error';
import { extractApiErrorMessage } from './extract-api-error';

export const LOGIN_NETWORK_ERROR = 'Network error during login';
export const LOGIN_INVALID_CREDENTIALS = 'Invalid credentials supplied';

const readStatus = (error: unknown): number | undefined => {
  if (isAdminApiError(error)) {
    return error.status;
  }

  return (error as { response?: { status?: number } }).response?.status;
};

const isNetworkFailure = (error: unknown): boolean => {
  const status = readStatus(error);

  if (status === 404) return true;
  if (isAdminApiError(error)) return status === undefined;

  const axiosErr = error as { response?: { status?: number } };
  return !axiosErr.response;
};

export const getLoginErrorMessage = (error: unknown): string => {
  if (isNetworkFailure(error)) {
    return LOGIN_NETWORK_ERROR;
  }

  const status = readStatus(error);

  if (status === 400 || status === 401 || status === 403) {
    const apiMessage = isAdminApiError(error)
      ? error.message
      : extractApiErrorMessage(error, '');

    const trimmed = apiMessage.trim();
    if (trimmed && trimmed !== 'Request failed') {
      return trimmed;
    }

    return LOGIN_INVALID_CREDENTIALS;
  }

  if (isAdminApiError(error)) {
    return error.message;
  }

  return extractApiErrorMessage(error, LOGIN_INVALID_CREDENTIALS);
};
