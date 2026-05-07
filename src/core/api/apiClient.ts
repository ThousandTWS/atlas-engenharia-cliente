/* eslint-disable no-useless-catch */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { isCookieAuthMode } from "../config/auth";
import { authSessionStore } from "../services/auth/session/authSessionStore";
import type { RefreshTokenDTO, TokenResponse } from "../services/auth/types";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "https://backend-atlas-engenharia-production-52b3.up.railway.app/api";

class ApiClient {
  private static instance: AxiosInstance;
  private static refreshPromise: Promise<TokenResponse> | null = null;

  private constructor() {}

  public static getInstance(): AxiosInstance {
    if (!ApiClient.instance) {
      ApiClient.instance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          "Content-Type": "application/json",
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

        const token = authSessionStore.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    ApiClient.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const { response } = error;

        const originalRequest = error.config as
          | (InternalAxiosRequestConfig & { _retry?: boolean })
          | undefined;

        if (response?.status === 401 && originalRequest && !originalRequest._retry) {
          const path =
            typeof originalRequest.url === "string" ? originalRequest.url : "";
          const isAuthEndpoint =
            path.includes("/auth/login") ||
            path.includes("/auth/refresh-token") ||
            path.includes("/auth/logout");

          if (!isAuthEndpoint) {
            originalRequest._retry = true;

            try {
              const cookieAuthMode = isCookieAuthMode();
              const currentRefreshToken = authSessionStore.getRefreshToken();
              if (!cookieAuthMode && !currentRefreshToken) {
                throw new Error("Sessão expirada");
              }

              if (!ApiClient.refreshPromise) {
                const refreshPayload = cookieAuthMode
                  ? undefined
                  : ({
                      refreshToken: currentRefreshToken,
                    } as RefreshTokenDTO);

                ApiClient.refreshPromise = ApiClient.instance
                  .post<TokenResponse>("/auth/refresh-token", refreshPayload)
                  .then((refreshResponse) => {
                    authSessionStore.setSession({
                      accessToken: refreshResponse.data.token ?? null,
                      refreshToken:
                        refreshResponse.data.refreshToken ??
                        currentRefreshToken,
                      user: refreshResponse.data.user ?? null,
                    });
                    return refreshResponse.data;
                  })
                  .finally(() => {
                    ApiClient.refreshPromise = null;
                  });
              }

              const refreshed = await ApiClient.refreshPromise;
              if (!cookieAuthMode && refreshed.token && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${refreshed.token}`;
              }
              return ApiClient.instance.request(originalRequest);
            } catch {
              authSessionStore.clear();
              if (
                typeof window !== "undefined" &&
                !window.location.pathname.startsWith("/auth/login")
              ) {
                window.location.assign("/auth/login");
              }
            }
          }
        }

        if (response?.status === 403) {
          console.error("Permission denied: Insufficient privileges.");
        }

        const errorMessage =
          response?.data?.message ||
          response?.data?.error ||
          error.message ||
          "An unexpected communication error occurred";

        return Promise.reject(new Error(errorMessage));
      },
    );
  }
}

const apiClient = ApiClient.getInstance();

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default apiClient;
