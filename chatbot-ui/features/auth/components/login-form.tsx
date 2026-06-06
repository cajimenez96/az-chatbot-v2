'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '../hooks/use-login';

function useLoginSchema() {
  const t = useTranslations('auth.login.validation');
  return z.object({
    email: z.string().email(t('emailInvalid')),
    password: z.string().min(1, t('passwordRequired')),
  });
}

type FormValues = { email: string; password: string };

export function LoginForm() {
  const t = useTranslations('auth.login');
  const login = useLogin();
  const schema = useLoginSchema();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit((data) => login.mutate(data))} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-[#3d5a3e] font-medium">
          {t('email')}
        </Label>
        <Input
          id="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          {...register('email')}
          className="border-[#a3b899] focus-visible:ring-[#40916c] bg-white/80"
        />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-[#3d5a3e] font-medium">
          {t('password')}
        </Label>
        <Input
          id="password"
          type="password"
          placeholder={t('passwordPlaceholder')}
          {...register('password')}
          className="border-[#a3b899] focus-visible:ring-[#40916c] bg-white/80"
        />
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {login.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {t('error')}
        </p>
      )}

      <Button
        type="submit"
        disabled={login.isPending}
        className="w-full bg-[#40916c] hover:bg-[#2d6a4f] text-white font-semibold py-2.5"
      >
        {login.isPending ? t('submitting') : t('submit')}
      </Button>

      <p className="text-center text-sm text-[#6b7c6b]">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-[#40916c] hover:underline font-medium">
          {t('createOne')}
        </Link>
      </p>
    </form>
  );
}
