'use client';

interface ShareButtonProps {
  amount?: string;
  txHash?: string;
}

export function ShareButton({ amount, txHash }: ShareButtonProps) {
  const tweetText = amount
    ? `🚀 Just bridged ${amount} USDC to Stacks using Bridge Swift! One-click USDCx bridging is finally here.\n\n#Stacks #USDCx #DeFi`
    : `🚀 Check out Bridge Swift - the easiest way to bridge USDC to Stacks!\n\n#Stacks #USDCx #DeFi`;

  const tweetUrl = txHash
    ? `https://sepolia.etherscan.io/tx/${txHash}`
    : 'https://bridge-swift.vercel.app';

  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`;

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-medium py-2 px-4 rounded-lg transition-colors"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share on X
    </a>
  );
}
