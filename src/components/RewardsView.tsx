'use client';

import React, { useState, useEffect } from 'react';
import { useParkingSession } from '../hooks/useParkingSession';
import { getSpotPointsBalance } from '../lib/services/pointsService';

interface RewardsViewProps {
  onBack: () => void;
}

export default function RewardsView({ onBack }: RewardsViewProps) {
  const { user } = useParkingSession();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (user?.id) {
      getSpotPointsBalance(user.id).then(setBalance).catch(console.error);
    }
  }, [user?.id]);

  const MOCK_REWARDS = [
    { id: '1', title: 'Free Coffee', business: 'Local Bean', cost: 500, icon: '☕' },
    { id: '2', title: '10% Off Any Purchase', business: 'Corner Store', cost: 300, icon: '🏷️' },
    { id: '3', title: 'Free Pastry', business: 'Morning Bakery', cost: 400, icon: '🥐' },
    { id: '4', title: 'Car Wash Token', business: 'Sparkle Wash', cost: 1000, icon: '🫧' },
  ];

  return (
    <div className="flex flex-col h-full bg-spot-cream p-6 overflow-y-auto pb-28 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-spot-cream border-2 border-spot-ink shadow-[0_2px_0_0_#171717] hover:bg-black/5 active:shadow-none active:translate-y-0.5 text-spot-ink transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h2 className="text-2xl font-black tracking-tight text-spot-ink">
          Rewards
        </h2>
      </div>

      <div className="bg-spot-yellow border-2 border-spot-ink shadow-[0_6px_0_0_#171717] p-6 rounded-3xl mb-8 flex items-center justify-between transform -rotate-1">
        <div>
          <p className="text-[10px] font-black text-spot-ink uppercase tracking-widest">Spot Points</p>
          <p className="text-4xl font-black text-spot-ink mt-1 tracking-tight">🟡 {balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-6 bg-white border-2 border-spot-ink/10 p-4 rounded-2xl">
        <p className="text-sm font-bold text-spot-ink">
          <span className="mr-2">ℹ️</span>
          Use your Spot Points for rewards from local businesses.
        </p>
      </div>

      <div className="space-y-0">
        {MOCK_REWARDS.map((reward) => (
          <div key={reward.id} className="py-6 border-b-2 border-spot-ink/10 relative overflow-hidden group last:border-0 flex flex-col">
            <div className="absolute top-4 right-0 bg-spot-red text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-l-full shadow-sm">
              DEMO
            </div>
            
            <div className="flex items-start">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-spot-ink shadow-[0_4px_0_0_#171717] flex items-center justify-center text-3xl shrink-0 group-hover:-translate-y-1 transition-transform">
                {reward.icon}
              </div>
              <div className="ml-5 flex-1 pt-0.5">
                <p className="text-[10px] font-black text-spot-orange uppercase tracking-widest mb-1">{reward.business}</p>
                <h3 className="text-lg font-black text-spot-ink leading-tight pr-12">{reward.title}</h3>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border-2 border-spot-ink/10 text-spot-ink rounded-xl text-xs font-black shadow-sm">
                    <span>🟡 {reward.cost}</span>
                  </span>
                  
                  <button 
                    disabled
                    className="px-4 py-2 bg-black/5 border-2 border-spot-ink/10 text-spot-muted font-black rounded-xl text-[10px] uppercase tracking-widest cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
