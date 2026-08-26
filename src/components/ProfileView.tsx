'use client';

import React from 'react';
import { useParkingSession } from '../hooks/useParkingSession';
import { signOutUser } from '../lib/services/authService';

interface ProfileViewProps {
  onNavigateToMap: () => void;
}

export default function ProfileView({ onNavigateToMap }: ProfileViewProps) {
  const { user, history, activeSession } = useParkingSession();

  const totalSessions = history.length + (activeSession ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto pb-28">
      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl border border-blue-200 dark:border-blue-800">
          SP
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Spot Parker</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
        </div>
      </div>

      {/* Active Session Callout */}
      {activeSession && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active Session</span>
            </div>
            <p className="text-xs text-slate-300 font-semibold mt-1 truncate max-w-[180px]">{activeSession.locationName}</p>
          </div>
          <button
            onClick={onNavigateToMap}
            className="text-xs font-bold bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl transition-colors"
          >
            Show on Map
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spot Points</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{(user?.points ?? 0).toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sessions</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalSessions}</p>
        </div>
      </div>

      {/* Help section or info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">How to earn points</h3>
        
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-sm mt-0.5">
            📍
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Park your car</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Open Spot when you park, choose "I'm Parked" to register your coordinates.</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-sm mt-0.5">
            🔑
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Leave and Earn</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">When leaving, tap "I'm Leaving" to free up the slot and earn +10 Spot Points instantly.</p>
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={() => signOutUser().catch(err => console.error(err))}
        className="mt-6 w-full py-3 bg-red-500/10 hover:bg-red-500/25 text-red-500 font-bold rounded-2xl text-xs transition-colors border border-red-500/20"
      >
        Sign Out
      </button>
    </div>
  );
}
