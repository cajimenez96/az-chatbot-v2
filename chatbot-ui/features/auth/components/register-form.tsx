'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegister } from '../hooks/use-register';

function useRegisterSchema() {
  const t = useTranslations('auth.register.validation');
  return z.object({
    email: z.string().email(t('emailInvalid')),
    password: z.string().min(8, t('passwordMin')),
    firstName: z.string().min(1, t('firstNameRequired')),
    lastName: z.string().min(1, t('lastNameRequired')),
    tenantName: z.string().min(2, t('companyMin')),
    tenantSlug: z
      .string()
      .min(2, t('slugMin'))
      .max(50)
      .regex(/^[a-z0-9-]+$/, t('slugPattern')),
  });
}

type FormValues = z.infer<ReturnType<typeof useRegisterSchema>>;

const INPUT_CLASS = 'border-[#a3b899] focus-visible:ring-[#40916c] bg-white/80';
const LABEL_CLASS = 'text-[#3d5a3e] font-medium';

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const schema = useRegisterSchema();
  const register_ = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit((data) => register_.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className={LABEL_CLASS}>{t('firstName')}</Label>
          <Input id="firstName" placeholder={t('firstNamePlaceholder')} {...register('firstName')} className={INPUT_CLASS} />
          {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className={LABEL_CLASS}>{t('lastName')}</Label>
          <Input id="lastName" placeholder={t('lastNamePlaceholder')} {...register('lastName')} className={INPUT_CLASS} />
          {errors.lastName && <p className="text-xs text-red-600">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className={LABEL_CLASS}>{t('workEmail')}</Label>
        <Input id="email" type="email" placeholder={t('workEmailPlaceholder')} {...register('email')} className={INPUT_CLASS} />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className={LABEL_CLASS}>{t('password')}</Label>
        <Input id="password" type="password" placeholder={t('passwordPlaceholder')} {...register('password')} className={INPUT_CLASS} />
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div className="border-t border-[#c9d9c2] pt-4 space-y-4">
        <p className="text-xs text-[#6b7c6b] font-medium uppercase tracking-wide">
          {t('workspaceSection')}
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="tenantName" className={LABEL_CLASS}>{t('companyName')}</Label>
          <Input id="tenantName" placeholder={t('companyNamePlaceholder')} {...register('tenantName')} className={INPUT_CLASS} />
          {errors.tenantName && <p className="text-xs text-red-600">{errors.tenantName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenantSlug" className={LABEL_CLASS}>{t('workspaceUrl')}</Label>
          <div className="flex items-center gap-0">
            <span className="border border-r-0 border-[#a3b899] bg-[#f0f4ed] px-3 py-2 text-sm text-[#6b7c6b] rounded-l-md">
              {t('workspaceUrlPrefix')}
            </span>
            <Input id="tenantSlug" placeholder={t('workspaceUrlPlaceholder')} {...register('tenantSlug')} className={`${INPUT_CLASS} rounded-l-none`} />
          </div>
          {errors.tenantSlug && <p className="text-xs text-red-600">{errors.tenantSlug.message}</p>}
        </div>
      </div>

      {register_.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {(register_.error as any)?.response?.data?.message ?? t('error')}
        </p>
      )}

      <Button
        type="submit"
        disabled={register_.isPending}
        className="w-full bg-[#40916c] hover:bg-[#2d6a4f] text-white font-semibold py-2.5"
      >
        {register_.isPending ? t('submitting') : t('submit')}
      </Button>

      <p className="text-center text-sm text-[#6b7c6b]">
        {t('hasAccount')}{' '}
        <Link href="/login" className="text-[#40916c] hover:underline font-medium">
          {t('signIn')}
        </Link>
      </p>
    </form>
  );
}
