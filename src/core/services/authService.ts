import apiClient from '../api/apiClient';
import { isCookieAuthMode } from '../config/auth';
import { notifyUserUpdated } from '../events/userObserver';
import { authSessionStore } from './authSessionStore';

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | string;

export interface User {
  id: string | number;
  nomeCompleto: string;
  email: string;
  username: string;
  telefone: string;
  role: UserRole;
  profilePictureUrl?: string | null;
  enabled: boolean;
}

export interface LoginDTO {
  login: string;
  password: string;
}

export interface RegisterDTO {
  nomeCompleto: string;
  email: string;
  username: string;
  telefone: string;
  confirmarEmail: string;
  password: string;
  confirmarPassword: string;
}

export interface VerifyEmailDTO {
  email: string;
  code: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  code: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface AuthSessionResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
  user: User;
}

const isCompleteUser = (value: Partial<User>): value is User =>
  value.id !== undefined &&
  value.id !== null &&
  typeof value.nomeCompleto === 'string' &&
  typeof value.email === 'string' &&
  typeof value.username === 'string' &&
  typeof value.telefone === 'string' &&
  typeof value.role === 'string' &&
  typeof value.enabled === 'boolean';

export const authService = {
  login: async (credentials: LoginDTO): Promise<AuthSessionResponse> => {
    const response = await apiClient.post<AuthSessionResponse>('/auth/login', credentials);
    authSessionStore.setSession({
      accessToken: response.data.token ?? null,
      refreshToken: response.data.refreshToken ?? null,
      user: response.data.user ?? null,
    });
    notifyUserUpdated(authSessionStore.getUser());
    return response.data;
  },

  register: async (data: RegisterDTO): Promise<string> => {
    const response = await apiClient.post<string>('/auth/register', data);
    return response.data;
  },

  verifyEmail: async (data: VerifyEmailDTO): Promise<string> => {
    const response = await apiClient.post<string>('/auth/verify-email', data);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<string> => {
    const response = await apiClient.post<string>('/auth/forgot-password', { email } as ForgotPasswordDTO);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordDTO): Promise<string> => {
    const response = await apiClient.post<string>('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Renovar sessão (rotaciona refresh token)
   */
  refreshSession: async (): Promise<TokenResponse> => {
    const currentRefreshToken = authSessionStore.getRefreshToken();

    const response = currentRefreshToken
      ? await apiClient.post<TokenResponse>('/auth/refresh-token', { refreshToken: currentRefreshToken } as RefreshTokenDTO)
      : await apiClient.post<TokenResponse>('/auth/refresh-token');

    authSessionStore.setSession({
      accessToken: response.data.token ?? null,
      refreshToken: response.data.refreshToken ?? currentRefreshToken ?? null,
      user: response.data.user ?? null,
    });

    notifyUserUpdated(authSessionStore.getUser());
    return response.data;
  },

  /**
   * Logout - limpa os dados de autenticação
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      authSessionStore.clear();
      notifyUserUpdated(null);
    }
  },

  /**
   * Obter usuário atual da sessão
   */
  getCurrentUser: (): User | null => {
    return authSessionStore.getUser();
  },

  /**
   * Obter sessão atual no backend
   */
  hydrateSession: async (): Promise<boolean> => {
    if (isCookieAuthMode()) {
      if (authService.getCurrentUser()) {
        return true;
      }
    } else if (authSessionStore.getAccessToken()) {
      return true;
    }

    try {
      await authService.refreshSession();
      return authService.isAuthenticated();
    } catch {
      authSessionStore.clear();
      notifyUserUpdated(null);
      return false;
    }
  },

  /**
   * Definir o usuário atual da sessão
   */
  setCurrentUser: (user: User | null): void => {
    authSessionStore.setSession({ user });
    notifyUserUpdated(user);
  },

  /**
   * Atualizar dados do usuário na sessão
   */
  updateLocalUser: (userData: Partial<User>): User | null => {
    const currentUser = authService.getCurrentUser();
    const updatedUser = currentUser
      ? { ...currentUser, ...userData }
      : isCompleteUser(userData)
        ? userData
        : null;

    if (!updatedUser) {
      return null;
    }

    authSessionStore.setSession({ user: updatedUser });
    notifyUserUpdated(updatedUser);
    return updatedUser;
  },

  /**
   * Verificar se o usuário está autenticado
   */
  isAuthenticated: (): boolean => {
    const user = authSessionStore.getUser();
    const token = authSessionStore.getAccessToken();
    return isCookieAuthMode() ? Boolean(user) || Boolean(token) : Boolean(token);
  },

  /**
   * Obter o token de acesso atual
   */
  getAccessToken: (): string | null => {
    return authSessionStore.getAccessToken();
  },

  /**
   * Obter o refresh token atual
   */
  getRefreshToken: (): string | null => {
    return authSessionStore.getRefreshToken();
  },
};
