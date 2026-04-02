import apiClient from '../api/apiClient';
import { notifyUserUpdated } from '../events/userObserver';
import { authSessionStore } from './authSessionStore';

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | string;

export interface Workshop {
  id: string | number;
  name: string;
  slug: string;
  logoUrl?: string | null;
  sidebarImageUrl?: string | null;
}

export interface User {
  id: string | number;
  fullName: string;
  email: string;
  role: UserRole;
  profilePhotoUrl?: string | null;
}

export interface LoginDTO {
  workshopSlug: string;
  email: string;
  password: string;
}

export interface SignupDTO {
  workshopName: string;
  workshopSlug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer' | string;
  expiresIn: number;
  workshop: Workshop;
  user: User;
}

export interface AuthMeResponse {
  workshop: Workshop;
  user: User;
}

const isCompleteUser = (value: Partial<User>): value is User =>
  value.id !== undefined &&
  value.id !== null &&
  typeof value.fullName === 'string' &&
  typeof value.email === 'string' &&
  typeof value.role === 'string';

export const authService = {
  /**
   * Criar uma nova oficina + usuário proprietário
   */
  signup: async (data: SignupDTO): Promise<AuthSessionResponse> => {
    const response = await apiClient.post<AuthSessionResponse>('/auth/signup', data);
    authSessionStore.setSession({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken ?? null,
      user: response.data.user,
      workshop: response.data.workshop,
    });
    notifyUserUpdated(response.data.user);
    return response.data;
  },

  /**
   * Autenticar um usuário dentro de uma oficina
   */
  login: async (credentials: LoginDTO): Promise<AuthSessionResponse> => {
    const response = await apiClient.post<AuthSessionResponse>('/auth/login', credentials);
    authSessionStore.setSession({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken ?? null,
      user: response.data.user,
      workshop: response.data.workshop,
    });
    notifyUserUpdated(response.data.user);
    return response.data;
  },

  /**
   * Renovar sessão (rotaciona refresh token)
   */
  refreshSession: async (): Promise<AuthSessionResponse> => {
    const currentRefreshToken = authSessionStore.getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    const response = await apiClient.post<AuthSessionResponse>('/auth/refresh', {
      refreshToken: currentRefreshToken,
    } as RefreshTokenDTO);

    authSessionStore.setSession({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken ?? null,
      user: response.data.user,
      workshop: response.data.workshop,
    });

    notifyUserUpdated(response.data.user);
    return response.data;
  },

  /**
   * Logout - limpa os dados de autenticação
   */
  logout: async (): Promise<void> => {
    try {
      const currentRefreshToken = authSessionStore.getRefreshToken();
      if (currentRefreshToken) {
        await apiClient.post('/auth/logout', { refreshToken: currentRefreshToken } as RefreshTokenDTO);
      }
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

  getCurrentWorkshop: (): Workshop | null => {
    return authSessionStore.getWorkshop();
  },

  /**
   * Obter sessão atual no backend
   */
  hydrateSession: async (): Promise<boolean> => {
    if (authService.getCurrentUser() && authService.getCurrentWorkshop()) {
      return true;
    }

    if (authSessionStore.getRefreshToken() && !authSessionStore.getAccessToken()) {
      try {
        await authService.refreshSession();
        return true;
      } catch {
        authSessionStore.clear();
        notifyUserUpdated(null);
        return false;
      }
    }

    try {
      const response = await apiClient.get<AuthMeResponse>('/auth/me');
      authSessionStore.setSession({ user: response.data.user, workshop: response.data.workshop });
      notifyUserUpdated(response.data.user);
      return true;
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

  setCurrentWorkshop: (workshop: Workshop | null): void => {
    authSessionStore.setSession({ workshop });
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
    const token = authSessionStore.getAccessToken();
    return Boolean(token);
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

  /**
   * Upload: logo da oficina autenticada
   */
  updateWorkshopLogo: async (file: File): Promise<AuthMeResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<AuthMeResponse>('/auth/me/workshop-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    authSessionStore.setSession({ workshop: response.data.workshop, user: response.data.user });
    notifyUserUpdated(response.data.user);
    return response.data;
  },

  /**
   * Upload: imagem da sidebar da oficina autenticada
   */
  updateSidebarImage: async (file: File): Promise<AuthMeResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<AuthMeResponse>('/auth/me/sidebar-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    authSessionStore.setSession({ workshop: response.data.workshop, user: response.data.user });
    notifyUserUpdated(response.data.user);
    return response.data;
  },

  /**
   * Upload: foto de perfil do usuário autenticado
   */
  updateProfilePhoto: async (file: File): Promise<AuthMeResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<AuthMeResponse>('/auth/me/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    authSessionStore.setSession({ workshop: response.data.workshop, user: response.data.user });
    notifyUserUpdated(response.data.user);
    return response.data;
  },
};
