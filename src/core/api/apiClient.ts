/* eslint-disable no-useless-catch */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { isCookieAuthMode } from '../config/auth';
import { authSessionStore } from '../services/authSessionStore';

export const API_BASE_URL = 'https://api-server.koyeb.app/api';

class ApiClient {
  private static instance: AxiosInstance;

  private constructor() {}

  public static getInstance(): AxiosInstance {
    if (!ApiClient.instance) {
      ApiClient.instance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: isCookieAuthMode(),
        timeout: 15000, 
      });

      this.setupInterceptors();
    }
    return ApiClient.instance;
  }

  private static setupInterceptors(): void {
    ApiClient.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (isCookieAuthMode()) {
          return config;
        }

        const token = authSessionStore.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    ApiClient.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const { response } = error;

        if (response?.status === 401) {
          console.warn('Authentication expired. Redirecting to login.');
          authSessionStore.clear();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/login')) {
            window.location.assign('/auth/login');
          }
        }

        if (response?.status === 403) {
          console.error('Permission denied: Insufficient privileges.');
        }

        const errorMessage = 
          response?.data?.message || 
          response?.data?.error || 
          error.message || 
          'An unexpected communication error occurred';

        return Promise.reject(new Error(errorMessage));
      }
    );
  }
}

const apiClient = ApiClient.getInstance();

export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default apiClient;
