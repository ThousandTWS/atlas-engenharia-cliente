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
  token: string | null;
  refreshToken: string | null;
  user: User;
}

export interface TokenResponse {
  token: string | null;
  refreshToken: string | null;
  user: User;
}

export interface AuthSessionState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}

export interface AuthSessionUpdate {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: User | null;
}
