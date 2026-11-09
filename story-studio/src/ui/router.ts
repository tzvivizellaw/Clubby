import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'library' }
  | { name: 'new' }
  | { name: 'ideas' }
  | { name: 'sample' }
  | { name: 'edit'; id: string }
  | { name: 'play'; id: string; fromEditor: boolean };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  const [path, query = ''] = h.split('?');
  const parts = path.split('/').filter(Boolean).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  switch (parts[0]) {
    case 'library':
      return { name: 'library' };
    case 'new':
      return { name: 'new' };
    case 'ideas':
      return { name: 'ideas' };
    case 'sample':
      return { name: 'sample' };
    case 'edit':
      return parts[1] ? { name: 'edit', id: parts[1] } : { name: 'library' };
    case 'play':
      return parts[1] ? { name: 'play', id: parts[1], fromEditor: query.includes('from=edit') } : { name: 'library' };
    default:
      return { name: 'home' };
  }
}

export function navigate(path: string): void {
  window.location.hash = path.startsWith('/') ? path : `/${path}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
