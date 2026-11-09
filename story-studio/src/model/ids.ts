let counter = 0;

/** Stable random ID. Never derived from names or order. */
export function newId(prefix = 'id'): string {
  counter = (counter + 1) % 1_000_000;
  let rand = '';
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    c.getRandomValues(bytes);
    rand = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  } else {
    rand = Math.random().toString(16).slice(2, 18);
  }
  return `${prefix}_${rand}${counter.toString(36)}`;
}
