import { useTranslations } from 'next-intl';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  return (
    <>
      <h1 className="text-xl font-bold text-[#1a3c2e] mb-1">{t('title')}</h1>
      <p className="text-sm text-[#6b7c6b] mb-6">{t('subtitle')}</p>
      <LoginForm />
    </>
  );
}
