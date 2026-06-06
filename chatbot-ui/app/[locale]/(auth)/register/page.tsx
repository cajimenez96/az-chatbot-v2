import { useTranslations } from 'next-intl';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  return (
    <>
      <h1 className="text-xl font-bold text-[#1a3c2e] mb-1">{t('title')}</h1>
      <p className="text-sm text-[#6b7c6b] mb-6">{t('subtitle')}</p>
      <RegisterForm />
    </>
  );
}
