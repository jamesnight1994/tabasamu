import type { CSSProperties } from 'react';

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const match = HEX_COLOR.exec(hex.trim());
  if (!match) {
    return null;
  }

  const raw = match[1];
  const normalized =
    raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${[r, g, b]
    .map((channel) =>
      Math.max(0, Math.min(255, channel)).toString(16).padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

/** Blend `amount` (0–1) toward black. */
export function darkenHex(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) {
    return hex;
  }

  const mix = (channel: number) =>
    Math.round(channel + (0 - channel) * amount);

  return toHex({ r: mix(rgb.r), g: mix(rgb.g), b: mix(rgb.b) });
}

function resolveHexColor(
  raw: string | undefined,
  fallback: string,
): string {
  const trimmed = raw?.trim();
  if (trimmed && HEX_COLOR.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

/** Default: light grey (~25% lighter than #D4D6D6). */
export const DEFAULT_ADMIN_TOPNAV_COLOR = '#DFE0E0';

/** Default profile control: topnav grey darkened 25% toward black. */
export const DEFAULT_ADMIN_TOPNAV_PROFILE_BG = darkenHex(
  DEFAULT_ADMIN_TOPNAV_COLOR,
  0.25,
);

/** Default sidenav active link accent (blue-600). */
export const DEFAULT_ADMIN_SIDENAV_ACTIVE_COLOR = '#2563EB';

/** Sidenav width: 6.4rem reduced by 15%. */
export const DEFAULT_ADMIN_SIDENAV_WIDTH = '5.44rem';

export function getAdminTopnavColor(): string {
  return resolveHexColor(
    process.env.NEXT_PUBLIC_ADMIN_TOPNAV_COLOR,
    DEFAULT_ADMIN_TOPNAV_COLOR,
  );
}

export function getAdminTopnavProfileBg(): string {
  const topnav = getAdminTopnavColor();
  return resolveHexColor(
    process.env.NEXT_PUBLIC_ADMIN_TOPNAV_PROFILE_BG,
    darkenHex(topnav, 0.25),
  );
}

export function getAdminSidenavActiveColor(): string {
  return resolveHexColor(
    process.env.NEXT_PUBLIC_ADMIN_SIDENAV_ACTIVE_COLOR,
    DEFAULT_ADMIN_SIDENAV_ACTIVE_COLOR,
  );
}

/** Dashboard tab underline/icon accent; falls back to sidenav active color. */
export function getAdminDashboardTabActiveColor(): string {
  return resolveHexColor(
    process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_TAB_ACTIVE_COLOR,
    getAdminSidenavActiveColor(),
  );
}

export function getAdminShellThemeStyle(): CSSProperties {
  const bg = getAdminTopnavColor();
  const profileBg = getAdminTopnavProfileBg();
  const activeColor = getAdminSidenavActiveColor();
  const dashboardTabActiveColor = getAdminDashboardTabActiveColor();

  return {
    '--admin-topnav-bg': bg,
    '--admin-topnav-fg': '#f8fafc',
    '--admin-topnav-control-bg': profileBg,
    '--admin-topnav-control-hover-bg': darkenHex(profileBg, 0.15),
    '--admin-sidenav-width': DEFAULT_ADMIN_SIDENAV_WIDTH,
    '--admin-sidenav-active-color': activeColor,
    '--admin-sidenav-active-bg': `color-mix(in srgb, ${activeColor} 12%, #ffffff)`,
    '--admin-dashboard-tab-active-color': dashboardTabActiveColor,
  } as CSSProperties;
}
