import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await api.post('/api/v1/auth/refresh');
        return api(original);
      } catch {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);
