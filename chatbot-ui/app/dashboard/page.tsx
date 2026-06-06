export const metadata = { title: 'Dashboard — Converxa' };

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#fefae0] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#40916c] to-[#1a3c2e]" />
          <span className="text-3xl font-bold text-[#1a3c2e]">converxa</span>
        </div>
        <p className="text-[#6b7c6b]">Dashboard — coming soon in T-03</p>
      </div>
    </main>
  );
}
