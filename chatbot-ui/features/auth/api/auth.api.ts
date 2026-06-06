import { api } from '@/lib/axios';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  tenantName: string;
  tenantSlug: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>('/api/v1/auth/register', data).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<AuthResponse>('/api/v1/auth/login', data).then((r) => r.data),

  refresh: () =>
    api.post<AuthResponse>('/api/v1/auth/refresh').then((r) => r.data),

  logout: () => api.post('/api/v1/auth/logout').then(() => undefined),
};
