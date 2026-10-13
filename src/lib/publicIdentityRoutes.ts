/** Public company / identity pages — must render without waiting on Firebase auth boot. */
export function isPublicIdentityPath(pathname: string): boolean {
  const path = (pathname || '/').replace(/\/$/, '') || '/';
  return (
    path === '/about' ||
    path === '/affiliate-terms' ||
    path === '/company' ||
    path === '/meet-the-board' ||
    path === '/leadership' ||
    path === '/founder' ||
    path === '/press' ||
    path === '/press-kit'
  );
}
