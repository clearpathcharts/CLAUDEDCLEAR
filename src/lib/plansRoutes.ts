export const PLANS_CANONICAL_PATH = '/plans';
export const PLANS_LEGACY_PATHS = ['/pricing', '/membership'] as const;

export function isPlansPath(pathname: string): boolean {
  const path = pathname.toLowerCase().trim();
  return path === PLANS_CANONICAL_PATH || PLANS_LEGACY_PATHS.includes(path as never);
}

export function canonicalPlansPath(pathname: string, search = ''): string {
  return isPlansPath(pathname) ? `${PLANS_CANONICAL_PATH}${search}` : `${pathname}${search}`;
}
