/* eslint-disable no-useless-catch */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = 'https://backend-atlas-engenharia-production-326c.up.railway.app/api';

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
        timeout: 15000, 
      });

      this.setupInterceptors();
    }
    return ApiClient.instance;
  }

  private static setupInterceptors(): void {
    ApiClient.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
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
          localStorage.removeItem('token');
          if (!window.location.hash.includes('/login')) {
             window.location.hash = '/login';
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
