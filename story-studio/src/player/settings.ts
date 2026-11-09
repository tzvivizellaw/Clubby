/** Small per-device preferences. Every access is guarded: storage may be unavailable. */

export interface PlayerSettings {
  sound: boolean;
  typing: boolean;
}

const KEY = 'hasipur.settings.v1';

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function loadSettings(): PlayerSettings {
  const defaults: PlayerSettings = { sound: false, typing: !prefersReducedMotion() };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : defaults.sound,
      typing: typeof parsed.typing === 'boolean' ? parsed.typing : defaults.typing,
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(s: PlayerSettings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* preferences are optional */
  }
}
