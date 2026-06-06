import { LoginForm } from '@/features/auth/components/login-form';

export const metadata = { title: 'Sign in — Converxa' };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-[#1a3c2e] mb-1">Welcome back</h1>
      <p className="text-sm text-[#6b7c6b] mb-6">Sign in to your workspace</p>
      <LoginForm />
    </>
  );
}
