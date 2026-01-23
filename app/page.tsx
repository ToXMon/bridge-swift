import { Header } from '@/components/Header';
import { BalanceCard } from '@/components/BalanceCard';
import { BridgeForm } from '@/components/BridgeForm';
import { Leaderboard } from '@/components/Leaderboard';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { NetworkStatus } from '@/components/NetworkStatus';

export default function Home() {
  return (
    <div className="min-h-screen bg-background page-glow">
      <Header />

      <main className="max-w-md mx-auto px-4 pb-12">
        <div className="mt-4">
          <NetworkStatus />
        </div>

        <div className="mt-6">
          <NetworkSwitcher />
        </div>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold text-white">Pro Bridge &amp; Leaderboard</h1>
          <p className="text-lg font-semibold text-white/90 mt-1">Your Balances</p>
        </div>

        <div className="mt-4">
          <BalanceCard />
        </div>

        <div className="mt-6">
          <BridgeForm />
        </div>

        <div className="mt-6">
          <Leaderboard />
        </div>
      </main>
    </div>
  );
}
