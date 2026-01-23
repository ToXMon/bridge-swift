'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="w-full px-4 py-3 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <span className="text-white font-bold text-xs">⚡</span>
        </div>
        <h1 className="text-base sm:text-lg font-semibold text-white">Bridge Swift</h1>
      </div>
      <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
    </header>
  );
}
