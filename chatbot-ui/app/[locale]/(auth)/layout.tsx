import { useTranslations } from 'next-intl';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth.layout');
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[#fefae0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#40916c] to-[#1a3c2e]" />
            <span className="text-2xl font-bold text-[#1a3c2e] tracking-tight">converxa</span>
          </div>
          <p className="text-sm text-[#6b7c6b]">WhatsApp chatbot platform</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm border border-[#c9d9c2] rounded-2xl shadow-sm p-8">
          {children}
        </div>
        <p className="text-center text-xs text-[#9aab93] mt-6">
          {t('footer', { year })}
        </p>
      </div>
    </main>
  );
}
