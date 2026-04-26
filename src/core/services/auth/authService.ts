import apiClient from '../../api/apiClient';
import { authSessionStore } from './session/authSessionStore';
import { isCookieAuthMode } from '../../config/auth';
import { notifyUserUpdated } from '../../events/userObserver';
import type { AuthSessionResponse, ForgotPasswordDTO, LoginDTO, RefreshTokenDTO, RegisterDTO, ResetPasswordDTO, TokenResponse, User, VerifyEmailDTO } from './types';

export type { ForgotPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO, User, VerifyEmailDTO } from './types';

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

  refreshSession: async (): Promise<TokenResponse> => {
    if (isCookieAuthMode()) {
      const response = await apiClient.post<TokenResponse>('/auth/refresh-token');
      authSessionStore.setSession({
        accessToken: response.data.token ?? null,
        refreshToken: response.data.refreshToken ?? null,
        user: response.data.user ?? null,
      });

      notifyUserUpdated(authSessionStore.getUser());
      return response.data;
    }

    const currentRefreshToken = authSessionStore.getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    const response = await apiClient.post<TokenResponse>(
      '/auth/refresh-token',
      { refreshToken: currentRefreshToken } as RefreshTokenDTO
    );

    authSessionStore.setSession({
      accessToken: response.data.token ?? null,
      refreshToken: response.data.refreshToken ?? currentRefreshToken ?? null,
      user: response.data.user ?? null,
    });

    notifyUserUpdated(authSessionStore.getUser());
    return response.data;
  },

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

  getCurrentUser: (): User | null => {
    return authSessionStore.getUser();
  },

  hydrateSession: async (): Promise<boolean> => {
    if (isCookieAuthMode()) {
      if (authService.getCurrentUser()) {
        return true;
      }
    } else if (authSessionStore.getAccessToken()) {
      return true;
    } else if (!authSessionStore.getRefreshToken()) {
      authSessionStore.clear();
      notifyUserUpdated(null);
      return false;
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

  setCurrentUser: (user: User | null): void => {
    authSessionStore.setSession({ user });
    notifyUserUpdated(user);
  },

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

  isAuthenticated: (): boolean => {
    const user = authSessionStore.getUser();
    const token = authSessionStore.getAccessToken();
    return isCookieAuthMode() ? Boolean(user) || Boolean(token) : Boolean(token);
  },

  getAccessToken: (): string | null => {
    return authSessionStore.getAccessToken();
  },

  getRefreshToken: (): string | null => {
    return authSessionStore.getRefreshToken();
  },
};
