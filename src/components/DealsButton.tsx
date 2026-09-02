import React from 'react';

interface DealsButtonProps {
  onClick: () => void;
}

export default function DealsButton({ onClick }: DealsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-3 bg-amber-500/90 hover:bg-amber-500 border border-amber-400/50 text-white rounded-2xl shadow-lg transition-colors flex items-center justify-center animate-pulse"
      title="View Nearby Deals"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    </button>
  );
}
