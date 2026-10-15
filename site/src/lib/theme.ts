import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
const KEY = 'ddm-theme';

// Storage can be missing or throw (private mode, blocked site data); the site works without it.
function readStored(): Theme {
  try {
    return window.localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function store(theme: Theme): void {
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    /* not persisted; the toggle still works for this visit */
  }
}

export const applyTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme;
};

/** Called before the first render, so a light-theme visitor never sees a dark flash. */
export const initTheme = (): void => applyTheme(readStored());

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readStored);
  useEffect(() => applyTheme(theme), [theme]);
  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      store(next);
      return next;
    });
  }, []);
  return [theme, toggle];
}
