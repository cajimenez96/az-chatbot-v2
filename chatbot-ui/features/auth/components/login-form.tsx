'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '../hooks/use-login';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit((data) => login.mutate(data))} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-[#3d5a3e] font-medium">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          className="border-[#a3b899] focus-visible:ring-[#40916c] bg-white/80"
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-[#3d5a3e] font-medium">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          className="border-[#a3b899] focus-visible:ring-[#40916c] bg-white/80"
        />
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {login.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Invalid email or password.
        </p>
      )}

      <Button
        type="submit"
        disabled={login.isPending}
        className="w-full bg-[#40916c] hover:bg-[#2d6a4f] text-white font-semibold py-2.5"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-[#6b7c6b]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#40916c] hover:underline font-medium">
          Create one
        </Link>
      </p>
    </form>
  );
}
