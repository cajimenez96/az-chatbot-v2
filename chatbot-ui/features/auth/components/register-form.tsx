'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegister } from '../hooks/use-register';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  tenantName: z.string().min(2, 'At least 2 characters'),
  tenantSlug: z
    .string()
    .min(2, 'At least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
});

type FormValues = z.infer<typeof schema>;

const INPUT_CLASS = 'border-[#a3b899] focus-visible:ring-[#40916c] bg-white/80';
const LABEL_CLASS = 'text-[#3d5a3e] font-medium';

export function RegisterForm() {
  const register_ = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <form
      onSubmit={handleSubmit((data) => register_.mutate(data))}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className={LABEL_CLASS}>
            First name
          </Label>
          <Input
            id="firstName"
            placeholder="Ana"
            {...register('firstName')}
            className={INPUT_CLASS}
          />
          {errors.firstName && (
            <p className="text-xs text-red-600">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className={LABEL_CLASS}>
            Last name
          </Label>
          <Input
            id="lastName"
            placeholder="García"
            {...register('lastName')}
            className={INPUT_CLASS}
          />
          {errors.lastName && (
            <p className="text-xs text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className={LABEL_CLASS}>
          Work email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          {...register('email')}
          className={INPUT_CLASS}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className={LABEL_CLASS}>
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          {...register('password')}
          className={INPUT_CLASS}
        />
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="border-t border-[#c9d9c2] pt-4 space-y-4">
        <p className="text-xs text-[#6b7c6b] font-medium uppercase tracking-wide">
          Your workspace
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="tenantName" className={LABEL_CLASS}>
            Company name
          </Label>
          <Input
            id="tenantName"
            placeholder="Acme Corp"
            {...register('tenantName')}
            className={INPUT_CLASS}
          />
          {errors.tenantName && (
            <p className="text-xs text-red-600">{errors.tenantName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenantSlug" className={LABEL_CLASS}>
            Workspace URL
          </Label>
          <div className="flex items-center gap-0">
            <span className="border border-r-0 border-[#a3b899] bg-[#f0f4ed] px-3 py-2 text-sm text-[#6b7c6b] rounded-l-md">
              converxa.app/
            </span>
            <Input
              id="tenantSlug"
              placeholder="acme-corp"
              {...register('tenantSlug')}
              className={`${INPUT_CLASS} rounded-l-none`}
            />
          </div>
          {errors.tenantSlug && (
            <p className="text-xs text-red-600">{errors.tenantSlug.message}</p>
          )}
        </div>
      </div>

      {register_.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {(register_.error as any)?.response?.data?.message ?? 'Registration failed. Try again.'}
        </p>
      )}

      <Button
        type="submit"
        disabled={register_.isPending}
        className="w-full bg-[#40916c] hover:bg-[#2d6a4f] text-white font-semibold py-2.5"
      >
        {register_.isPending ? 'Creating account…' : 'Start free trial'}
      </Button>

      <p className="text-center text-sm text-[#6b7c6b]">
        Already have an account?{' '}
        <Link href="/login" className="text-[#40916c] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
