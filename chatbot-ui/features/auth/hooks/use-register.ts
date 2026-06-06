'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, RegisterPayload } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export function useRegister() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterPayload) => authApi.register(data),
    onSuccess: ({ accessToken }) => {
      setAccessToken(accessToken);
      router.push('/dashboard');
    },
  });
}
