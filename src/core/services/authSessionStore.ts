import type { User, Workshop } from './authService';

const AUTH_ACCESS_TOKEN_KEY = 'auth.access_token';
const AUTH_REFRESH_TOKEN_KEY = 'auth.refresh_token';
const AUTH_USER_KEY = 'auth.user';
const AUTH_WORKSHOP_KEY = 'auth.workshop';

interface AuthSessionState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  workshop: Workshop | null;
}

interface AuthSessionUpdate {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: User | null;
  workshop?: Workshop | null;
}

let hasHydratedFromSessionStorage = false;
let inMemoryState: AuthSessionState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  workshop: null,
};

const canUseSessionStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
  } catch {
    return false;
  }
};

const readSessionValue = (key: string): string | null => {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeSessionValue = (key: string, value: string | null): void => {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    if (value === null) {
      window.sessionStorage.removeItem(key);
      return;
    }

    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures (private mode, disabled storage, etc).
  }
};

const parseStoredUser = (rawUser: string | null): User | null => {
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
};

const parseStoredWorkshop = (rawWorkshop: string | null): Workshop | null => {
  if (!rawWorkshop) {
    return null;
  }

  try {
    return JSON.parse(rawWorkshop) as Workshop;
  } catch {
    return null;
  }
};

const hydrate = (): void => {
  if (hasHydratedFromSessionStorage) {
    return;
  }

  inMemoryState = {
    accessToken: readSessionValue(AUTH_ACCESS_TOKEN_KEY),
    refreshToken: readSessionValue(AUTH_REFRESH_TOKEN_KEY),
    user: parseStoredUser(readSessionValue(AUTH_USER_KEY)),
    workshop: parseStoredWorkshop(readSessionValue(AUTH_WORKSHOP_KEY)),
  };

  hasHydratedFromSessionStorage = true;
};

export const authSessionStore = {
  setSession: (update: AuthSessionUpdate): void => {
    hydrate();

    if ('accessToken' in update) {
      inMemoryState.accessToken = update.accessToken ?? null;
      writeSessionValue(AUTH_ACCESS_TOKEN_KEY, inMemoryState.accessToken);
    }

    if ('refreshToken' in update) {
      inMemoryState.refreshToken = update.refreshToken ?? null;
      writeSessionValue(AUTH_REFRESH_TOKEN_KEY, inMemoryState.refreshToken);
    }

    if ('user' in update) {
      inMemoryState.user = update.user ?? null;
      writeSessionValue(
        AUTH_USER_KEY,
        inMemoryState.user ? JSON.stringify(inMemoryState.user) : null
      );
    }

    if ('workshop' in update) {
      inMemoryState.workshop = update.workshop ?? null;
      writeSessionValue(
        AUTH_WORKSHOP_KEY,
        inMemoryState.workshop ? JSON.stringify(inMemoryState.workshop) : null
      );
    }
  },

  clear: (): void => {
    inMemoryState = { accessToken: null, refreshToken: null, user: null, workshop: null };
    writeSessionValue(AUTH_ACCESS_TOKEN_KEY, null);
    writeSessionValue(AUTH_REFRESH_TOKEN_KEY, null);
    writeSessionValue(AUTH_USER_KEY, null);
    writeSessionValue(AUTH_WORKSHOP_KEY, null);
  },

  getAccessToken: (): string | null => {
    hydrate();
    return inMemoryState.accessToken;
  },

  getRefreshToken: (): string | null => {
    hydrate();
    return inMemoryState.refreshToken;
  },

  getUser: (): User | null => {
    hydrate();
    return inMemoryState.user;
  },

  getWorkshop: (): Workshop | null => {
    hydrate();
    return inMemoryState.workshop;
  },
};
