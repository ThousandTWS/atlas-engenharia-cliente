/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiRequest } from "../api/apiClient";
import { notifyUserUpdated } from "../events/userObserver";
import { authSessionStore } from "./authSessionStore";
import type { User } from "./authService";

export const UserService = {
  async getProfile(): Promise<User> {
    return await apiRequest<User>({
      url: "/profile",
      method: "GET",
    });
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    return await apiRequest<User>({
      url: "/profile",
      method: "PUT",
      data,
    });
  },

  async changePassword(data: any): Promise<void> {
    return await apiRequest<void>({
      url: "/profile/change-password",
      method: "PUT",
      data,
    });
  },

  async uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiRequest<{ url: string }>({
      url: "/profile/photo",
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.url;
  },

  saveLocalUser(user: User): void {
    authSessionStore.setSession({ user });
    notifyUserUpdated(user);
  },

  getLocalUser(): User | null {
    return authSessionStore.getUser();
  },
};
