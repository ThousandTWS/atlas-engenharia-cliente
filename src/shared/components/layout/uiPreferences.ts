import React from 'react';

export type UiPreferences = {
  showBreadcrumbs: boolean;
  showGlobalSearch: boolean;
};

const STORAGE_KEY = 'atlas.ui_preferences.v1';

const DEFAULT_PREFERENCES: UiPreferences = {
  showBreadcrumbs: true,
  showGlobalSearch: true,
};

const safeParse = (raw: string | null): Partial<UiPreferences> | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<UiPreferences>;
  } catch {
    return null;
  }
};

export const loadUiPreferences = (): UiPreferences => {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return {
    showBreadcrumbs: parsed?.showBreadcrumbs ?? DEFAULT_PREFERENCES.showBreadcrumbs,
    showGlobalSearch: parsed?.showGlobalSearch ?? DEFAULT_PREFERENCES.showGlobalSearch,
  };
};

export const saveUiPreferences = (prefs: UiPreferences): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};

export const useUiPreferences = () => {
  const [preferences, setPreferences] = React.useState<UiPreferences>(() => loadUiPreferences());

  const updatePreferences = React.useCallback((patch: Partial<UiPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      saveUiPreferences(next);
      return next;
    });
  }, []);

  return { preferences, updatePreferences };
};

