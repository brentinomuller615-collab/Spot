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
          Points History
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-3xl shadow-sm mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Balance</p>
          <p className="text-3xl font-black text-amber-500 mt-1">🟡 {balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Recent Transactions</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <span className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin inline-block"></span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-8 rounded-3xl text-center shadow-sm">
            <div className="text-4xl mb-3">👻</div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No points yet</h3>
            <p className="text-xs text-slate-400 mt-1">Start parking to earn Spot Points.</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl shadow-sm flex items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-xl shrink-0">
                {getTransactionIcon(tx.type)}
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{tx.description}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right ml-2 shrink-0">
                <p className={`text-base font-black ${tx.amount > 0 ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
