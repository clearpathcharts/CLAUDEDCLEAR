/** Public company / identity pages — must render without waiting on Firebase auth boot. */
export function isPublicIdentityPath(pathname: string): boolean {
  const path = (pathname || '/').replace(/\/$/, '') || '/';
  return (
    path === '/about' ||
    path === '/company' ||
    path === '/meet-the-board' ||
    path === '/leadership' ||
    path === '/founder' ||
    path === '/ceo-statement' ||
    path === '/press' ||
    path === '/press-kit' ||
    path === '/pitch' ||
    path.startsWith('/pitch/') ||
    path === '/technology-opportunity' ||
    path === '/invest' ||
    path === '/communications'
  );
}
