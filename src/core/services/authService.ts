import apiClient from '../api/apiClient';

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
}

export interface LoginDTO {
  login: string;
  password: string;
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
  token: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

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

    if (response.data.token) {
      console.log('authService.login: Token encontrado, armazenando...');
      // Armazenar tokens
      localStorage.setItem('token', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      // Armazenar dados do usuário se disponíveis
      if (response.data.user) {
        console.log('authService.login: Dados do usuário encontrados, armazenando...', response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        console.warn('authService.login: Dados do usuário NÃO encontrados na resposta');
      }

      // Disparar evento para outros componentes (Header) atualizarem
      window.dispatchEvent(new Event('userUpdated'));
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
    const currentRefreshToken = localStorage.getItem('refreshToken');
    
    if (!currentRefreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    const response = await apiClient.post<TokenResponse>('/auth/refresh-token', {
      refreshToken: currentRefreshToken,
    } as RefreshTokenDTO);

    // Atualizar tokens no localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

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
      // Limpar tokens e dados do usuário do localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Disparar evento de logout
      window.dispatchEvent(new Event('userUpdated'));
    }
  },

  /**
   * Obter usuário atual do localStorage
   */
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Atualizar dados do usuário no localStorage
   */
  updateLocalUser: (userData: Partial<User>): User | null => {
    const currentUser = authService.getCurrentUser();
    console.log('authService.updateLocalUser: Updating user with:', userData);
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('authService.updateLocalUser: New user data saved to localStorage:', updatedUser);

      // Disparar evento para outros componentes (Header) atualizarem
      window.dispatchEvent(new Event('userUpdated'));
      return updatedUser;
    } else {
      console.warn('authService.updateLocalUser: No currentUser found to update');
    }
    return null;
  },

  /**
   * Verificar se o usuário está autenticado
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const isAuth = !!token; // Se tem token, considera autenticado por enquanto para o redirecionamento
    
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
    return localStorage.getItem('token');
  },

  /**
   * Obter o refresh token atual
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },
};
