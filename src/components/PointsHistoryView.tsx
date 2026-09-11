'use client';

import React, { useState, useEffect } from 'react';
import { useParkingSession } from '../hooks/useParkingSession';
import { subscribeToSpotPointsTransactions } from '../lib/services/pointsService';
import { SpotPointsTransaction } from '../lib/types';

interface PointsHistoryViewProps {
  onBack: () => void;
}

export default function PointsHistoryView({ onBack }: PointsHistoryViewProps) {
  const { user } = useParkingSession();
  const [transactions, setTransactions] = useState<SpotPointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = subscribeToSpotPointsTransactions(user.id, (data) => {
      setTransactions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'parking_contribution': return '📍';
      case 'leaving_report': return '🚶';
      case 'successful_handoff': return '🚗';
      case 'accuracy_bonus': return '🎯';
      case 'reward_redemption': return '🎁';
      default: return '💰';
    }
  };

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
          Points History
        </h2>
      </div>

      <div className="bg-spot-yellow border-2 border-spot-ink shadow-[0_6px_0_0_#171717] p-6 rounded-3xl mb-8 flex items-center justify-between transform rotate-1">
        <div>
          <p className="text-[10px] font-black text-spot-ink uppercase tracking-widest">Current Balance</p>
          <p className="text-4xl font-black text-spot-ink mt-1 tracking-tight">🟡 {balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-black text-spot-ink uppercase tracking-widest mb-4">Recent Transactions</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <span className="w-6 h-6 border-2 border-spot-ink/20 border-t-spot-orange rounded-full animate-spin inline-block"></span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white border-2 border-spot-ink p-8 rounded-3xl text-center shadow-[0_4px_0_0_#171717] transform -rotate-1 mt-4">
            <div className="text-5xl mb-4 transform hover:scale-110 transition-transform cursor-default">👻</div>
            <h3 className="text-lg font-black text-spot-ink">No points yet</h3>
            <p className="text-sm text-spot-muted mt-1 font-bold">Start parking to earn Spot Points.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-4 border-b-2 border-spot-ink/10 flex items-center last:border-b-0">
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-spot-ink shadow-[0_2px_0_0_#171717] flex items-center justify-center text-xl shrink-0">
                  {getTransactionIcon(tx.type)}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-black text-spot-ink">{tx.description}</p>
                  <p className="text-[10px] text-spot-muted font-bold tracking-wider uppercase mt-1">
                    {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className={`text-lg font-black ${tx.amount > 0 ? 'text-spot-green' : 'text-spot-ink'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
