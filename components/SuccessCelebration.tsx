import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface SuccessCelebrationProps {
  show: boolean;
  onComplete?: () => void;
  amount?: string;
  txHash?: string;
  network?: 'mainnet' | 'testnet';
}

export function SuccessCelebration({ show, onComplete, amount, txHash, network = 'mainnet' }: SuccessCelebrationProps) {
  const hasCelebrated = useRef(false);

  useEffect(() => {
    if (show && !hasCelebrated.current) {
      hasCelebrated.current = true;

      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.5, 0.7) },
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        });

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.5, 0.7) },
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        });
      }, 250);

      setTimeout(() => {
        onComplete?.();
        hasCelebrated.current = false;
      }, duration + 500);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="success-celebration fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4 transform animate-bounce pointer-events-auto">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bridge Complete! 🎉</h2>

        {amount && (
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Successfully bridged
            <span className="font-semibold text-green-600 dark:text-green-400"> {amount} USDCx</span>
          </p>
        )}

        {network && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Network: <span className="font-semibold capitalize">{network}</span>
          </p>
        )}

        {txHash && (
          <a
            href={network === 'mainnet' 
              ? `https://explorer.hiro.so/txid/${txHash}`
              : `https://explorer.hiro.so/txid/${txHash}?chain=testnet`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            View on Stacks Explorer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
