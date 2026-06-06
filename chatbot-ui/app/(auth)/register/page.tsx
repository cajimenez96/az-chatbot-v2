import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata = { title: 'Create account — Converxa' };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-[#1a3c2e] mb-1">Start your free trial</h1>
      <p className="text-sm text-[#6b7c6b] mb-6">14 days free, no credit card required</p>
      <RegisterForm />
    </>
  );
}
