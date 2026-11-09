import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reveal text character by character. `finish()` shows it all at once.
 * The count is tied to the line's key, so a new line never inherits the previous line's progress.
 */
export function useTypewriter(text: string, enabled: boolean, resetKey = '', speedMs = 28) {
  const key = `${resetKey}\u0000${text}`;
  const [st, setSt] = useState(() => ({ key, count: enabled ? 0 : text.length }));
  const count = st.key === key ? st.count : enabled ? 0 : text.length;
  useEffect(() => {
    if (!enabled) {
      setSt({ key, count: text.length });
      return;
    }
    setSt({ key, count: 0 });
    const len = text.length;
    const id = window.setInterval(() => {
      setSt((prev) => {
        const cur = prev.key === key ? prev.count : 0;
        if (cur >= len) {
          window.clearInterval(id); // finished (or skipped with finish()) — stop ticking
          return prev;
        }
        return { key, count: cur + 1 };
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [key, text.length, enabled, speedMs]);
  const done = count >= text.length;
  return { visible: done ? undefined : count, done, finish: () => setSt({ key, count: text.length }) };
}

/** Track an element's width (for picking bubble vs. card layout). Works when the element mounts later. */
export function useElementWidth<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  const ref = useRef<T | null>(null);
  const callbackRef = useCallback((node: T | null) => {
    ref.current = node;
    setEl(node);
  }, []);
  useEffect(() => {
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [callbackRef, width, ref] as const;
}
