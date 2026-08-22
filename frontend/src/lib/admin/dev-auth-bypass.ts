export const DEV_BYPASS_TOKEN = '__admin_dev_bypass__';

export function isAdminDevBypassEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_APP_ENV === 'development' &&
    process.env.NEXT_PUBLIC_ADMIN_AUTH_BYPASS === 'true' &&
    Boolean(process.env.NEXT_PUBLIC_ADMIN_API_KEY?.trim())
  );
}

export function isDevBypassSession(token: string | null | undefined): boolean {
  return token === DEV_BYPASS_TOKEN;
}

export function buildDevBypassStaff(email: string) {
  return {
    id: 'dev-bypass',
    email,
    name: 'Dev Admin (bypass)',
    roles: ['admin'],
  };
}

export function getDevBypassApiKey(): string | null {
  if (!isAdminDevBypassEnabled()) return null;
  return process.env.NEXT_PUBLIC_ADMIN_API_KEY!.trim();
}

export function isActiveDevBypassSession(token: string | null | undefined): boolean {
  return isAdminDevBypassEnabled() && isDevBypassSession(token);
}
