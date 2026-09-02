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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto pb-28 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">
          Rewards
        </h2>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5 rounded-3xl mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Spot Points</p>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-500 mt-1">🟡 {balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 p-4 rounded-2xl">
        <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
          ℹ️ Use your Spot Points for rewards from local businesses.
        </p>
      </div>

      <div className="space-y-4">
        {MOCK_REWARDS.map((reward) => (
          <div key={reward.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-3xl shadow-sm relative overflow-hidden group">
            {/* DEMO Ribbon */}
            <div className="absolute top-4 right-[-30px] bg-red-500 text-white text-[10px] font-black uppercase px-10 py-1 rotate-45 opacity-80 shadow-md">
              DEMO
            </div>
            
            <div className="flex items-start">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-3xl shrink-0">
                {reward.icon}
              </div>
              <div className="ml-4 flex-1 pt-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{reward.business}</p>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{reward.title}</h3>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-lg text-xs font-bold">
                    <span>🟡 {reward.cost}</span>
                  </span>
                  
                  <button 
                    disabled
                    className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl text-xs cursor-not-allowed"
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
