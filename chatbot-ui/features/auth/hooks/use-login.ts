'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, LoginPayload } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export function useLogin() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: ({ accessToken }) => {
      setAccessToken(accessToken);
      router.push('/dashboard');
    },
  });
}
