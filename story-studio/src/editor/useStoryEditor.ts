import { useCallback, useEffect, useRef, useState } from 'react';
import type { Story } from '../model/types';
import { getStore, type SaveResult } from '../storage/storage';

export type SaveStatus = 'saved' | 'saving' | 'error-quota' | 'error-unavailable' | 'error';

interface History {
  past: Story[];
  present: Story;
  future: Story[];
  lastKey: string | null;
  lastAt: number;
}

const MAX_HISTORY = 80;

/**
 * Editor state: undo/redo history + automatic local save.
 * `coalesce` merges rapid edits with the same key (typing, dragging) into one undo step.
 */
export function useStoryEditor(initial: Story) {
  const [h, setH] = useState<History>({ past: [], present: initial, future: [], lastKey: null, lastAt: 0 });
  const [status, setStatus] = useState<SaveStatus>('saved');
  const first = useRef(true);

  const update = useCallback((fn: (s: Story) => Story, coalesce?: string) => {
    setH((prev) => {
      const nextStory = fn(prev.present);
      if (nextStory === prev.present) return prev;
      const stamped = { ...nextStory, updatedAt: Date.now() };
      const now = Date.now();
      const merge = !!coalesce && coalesce === prev.lastKey && now - prev.lastAt < 1500;
      return {
        past: merge ? prev.past : [...prev.past, prev.present].slice(-MAX_HISTORY),
        present: stamped,
        future: [],
        lastKey: coalesce ?? null,
        lastAt: now,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setH((prev) =>
      prev.past.length
        ? { past: prev.past.slice(0, -1), present: prev.past[prev.past.length - 1], future: [prev.present, ...prev.future], lastKey: null, lastAt: 0 }
        : prev,
    );
  }, []);

  const redo = useCallback(() => {
    setH((prev) =>
      prev.future.length
        ? { past: [...prev.past, prev.present], present: prev.future[0], future: prev.future.slice(1), lastKey: null, lastAt: 0 }
        : prev,
    );
  }, []);

  // Autosave (debounced). Shows a real status.
  const story = h.present;
  const saveNow = useCallback((s: Story): SaveResult => {
    const res = getStore().save(s);
    if (res.ok) setStatus('saved');
    else setStatus(res.reason === 'quota' ? 'error-quota' : res.reason === 'unavailable' ? 'error-unavailable' : 'error');
    return res;
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus('saving');
    const t = window.setTimeout(() => saveNow(story), 450);
    return () => window.clearTimeout(t);
  }, [story, saveNow]);

  // Save immediately if the page is being closed mid-debounce.
  const latest = useRef(story);
  latest.current = story;
  useEffect(() => {
    const flush = () => getStore().save(latest.current);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  return {
    story,
    update,
    undo,
    redo,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
    status,
    retrySave: () => saveNow(latest.current),
  };
}
