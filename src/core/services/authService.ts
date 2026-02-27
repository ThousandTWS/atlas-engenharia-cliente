import apiClient from '../api/apiClient';
import { isCookieAuthMode } from '../config/auth';
import { notifyUserUpdated } from '../events/userObserver';
import { authSessionStore } from './authSessionStore';

// ==========================================
// Interfaces de Usuário e Autenticação
// ==========================================

export interface User {
  id: string | number;
  nomeCompleto: string;
  email: string;
  username: string;
  telefone: string;
  profilePictureUrl?: string;
  role: string;
  enabled: boolean;
}

// ==========================================
// DTOs de Request
// ==========================================

export interface RegisterDTO {
  nomeCompleto: string;
  email: string;
  username: string;
  telefone: string;
  confirmarEmail: string;
  password: string;
  confirmarPassword: string;
  recaptchaToken?: string;
}

export interface LoginDTO {
  login: string;
  password: string;
  recaptchaToken?: string;
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

// ==========================================
// DTOs de Response
// ==========================================

export interface TokenResponse {
  token?: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user?: User;
  token?: string;
  refreshToken?: string;
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

// ==========================================
// Auth Service
// ==========================================

export const authService = {
  /**
   * Fazer login
   * Autentica o usuário e retorna um token JWT e um refresh token
   */
  login: async (credentials: LoginDTO): Promise<AuthResponse> => {
    console.log('authService.login: Iniciando chamada à API');
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    console.log('authService.login: Resposta da API recebida', response.data);

    if (isCookieAuthMode()) {
      authSessionStore.setSession({
        token: null,
        refreshToken: null,
        user: response.data.user ?? null,
      });

      notifyUserUpdated(authSessionStore.getUser());
      return response.data;
    }

    if (response.data.token) {
      console.log('authService.login: Token encontrado, armazenando...');
      authSessionStore.setSession({
        token: response.data.token,
        refreshToken: response.data.refreshToken ?? null,
        user: response.data.user ?? null,
      });

      notifyUserUpdated(authSessionStore.getUser());
    } else {
      console.error('authService.login: Token NÃO encontrado na resposta');
    }

    return response.data;
  },

  /**
   * Registrar novo usuário
   * Cria uma nova conta e envia código de verificação por email
   */
  register: async (userData: RegisterDTO): Promise<string> => {
    const response = await apiClient.post<string>('/auth/register', userData);
    return response.data;
  },

  /**
   * Validar email
   * Valida o cadastro usando o código enviado por email
   */
  verifyEmail: async (data: VerifyEmailDTO): Promise<string> => {
    const response = await apiClient.post<string>('/auth/verify-email', data);
    return response.data;
  },

  /**
   * Esqueci a senha
   * Envia um código de redefinição para o email do usuário
   */
  forgotPassword: async (email: string): Promise<string> => {
    const response = await apiClient.post<string>('/auth/forgot-password', { email } as ForgotPasswordDTO);
    return response.data;
  },

  /**
   * Redefinir senha
   * Redefine a senha do usuário usando o código recebido
   */
  resetPassword: async (data: ResetPasswordDTO): Promise<string> => {
    const response = await apiClient.post<string>('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Atualizar token de acesso
   * Gera um novo token JWT usando um refresh token válido
   */
  refreshToken: async (): Promise<TokenResponse> => {
    if (isCookieAuthMode()) {
      const response = await apiClient.post<TokenResponse>('/auth/refresh-token');
      return response.data;
    }

    const currentRefreshToken = authSessionStore.getRefreshToken();
    
    if (!currentRefreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    const response = await apiClient.post<TokenResponse>('/auth/refresh-token', {
      refreshToken: currentRefreshToken,
    } as RefreshTokenDTO);

    authSessionStore.setSession({
      token: response.data.token,
      refreshToken: response.data.refreshToken ?? currentRefreshToken,
    });

    return response.data;
  },

  /**
   * Logout - limpa os dados de autenticação
   */
  logout: async (): Promise<void> => {
    try {
      // Chamar endpoint de logout para limpar cookies HttpOnly no backend
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
   * Hidratar sessão com backend (modo cookie)
   */
  hydrateSession: async (): Promise<boolean> => {
    if (authService.getCurrentUser()) {
      return true;
    }

    if (!isCookieAuthMode()) {
      return authService.isAuthenticated();
    }

    try {
      const response = await apiClient.get<User>('/profile');
      authService.setCurrentUser(response.data);
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

  /**
   * Atualizar dados do usuário na sessão
   */
  updateLocalUser: (userData: Partial<User>): User | null => {
    const currentUser = authService.getCurrentUser();
    console.log('authService.updateLocalUser: Updating user with:', userData);
    const updatedUser = currentUser
      ? { ...currentUser, ...userData }
      : isCompleteUser(userData)
        ? userData
        : null;

    if (!updatedUser) {
      console.warn('authService.updateLocalUser: No current user and partial payload is not enough to create one');
      return null;
    }

    authSessionStore.setSession({ user: updatedUser });
    console.log('authService.updateLocalUser: New user data saved to session store:', updatedUser);

    notifyUserUpdated(updatedUser);
    return updatedUser;
  },

  /**
   * Verificar se o usuário está autenticado
   */
  isAuthenticated: (): boolean => {
    const token = authSessionStore.getToken();
    const user = authSessionStore.getUser();
    const isAuth = isCookieAuthMode() ? !!user : !!token;
    
    console.log('authService.isAuthenticated:', { 
      isAuth,
      hasToken: !!token, 
      hasUser: !!user 
    });
    
    return isAuth;
  },

  /**
   * Obter o token de acesso atual
   */
  getToken: (): string | null => {
    return authSessionStore.getToken();
  },

  /**
   * Obter o refresh token atual
   */
  getRefreshToken: (): string | null => {
    return authSessionStore.getRefreshToken();
  },
};
