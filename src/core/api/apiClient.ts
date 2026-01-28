import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://76.13.169.111:8080/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// A função para configurar o token será chamada externamente
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Interceptor para tratar erros de forma global
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Se o erro for 401 (Não autorizado), redireciona para login
    if (error.response?.status === 401) {
      console.error('Token expirado ou inválido. Redirecionando para login...');
      
      // Evita loop se já estivermos na página de login
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }

    // Log detalhado para depuração de erros 403
    if (error.response?.status === 403) {
      console.error('Erro 403: Acesso negado. Verifique as permissões do usuário.');
    }

    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Erro na requisição';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;

// Mantendo uma função similar ao apiRequest para facilitar a transição onde for necessário
export async function apiRequest<T>(
  endpoint: string,
  options: any = {}
): Promise<T> {
  const { method = 'GET', body, ...rest } = options;

  const response = await apiClient.request({
    url: endpoint,
    method,
    data: body ? JSON.parse(body) : undefined,
    ...rest,
  });

  return response.data;
}
