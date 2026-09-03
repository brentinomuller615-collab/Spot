'use client';

import React, { useState, useEffect } from 'react';
import { useParkingSession } from '../hooks/useParkingSession';
import { signOutUser } from '../lib/services/authService';
import { updateUsername, updatePrivacyMode } from '../lib/services/userService';
import { getSpotPointsBalance } from '../lib/services/pointsService';
import { PrivacyMode } from '../lib/types';

interface ProfileViewProps {
  onNavigateToMap: () => void;
  onNavigateToPointsHistory: () => void;
  onNavigateToRewards: () => void;
}

export default function ProfileView({ onNavigateToMap, onNavigateToPointsHistory, onNavigateToRewards }: ProfileViewProps) {
  const { user, authEmail, history, activeSession } = useParkingSession();
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [aliasError, setAliasError] = useState('');
  const [isSavingAlias, setIsSavingAlias] = useState(false);
  
  const [spotPointsBalance, setSpotPointsBalance] = useState(0);

  useEffect(() => {
    if (user?.id) {
      getSpotPointsBalance(user.id).then(setSpotPointsBalance).catch(console.error);
    }
  }, [user?.id]);

  const totalSessions = history.length + (activeSession ? 1 : 0);

  const handleSaveAlias = async () => {
    if (!user) return;
    setAliasError('');
    setIsSavingAlias(true);
    
    try {
      const success = await updateUsername(user.id, aliasInput);
      if (success) {
        setIsEditingAlias(false);
      } else {
        setAliasError('Username already taken');
      }
    } catch (err: any) {
      console.error("Save alias error:", err);
      setAliasError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSavingAlias(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto pb-28">
      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            user?.username ? user.username.substring(0, 2).toUpperCase() : 'SP'
          )}
        </div>
        <div className="flex-1">
          {isEditingAlias ? (
            <div className="flex flex-col space-y-2">
              <input 
                type="text" 
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                placeholder="Choose a unique alias"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                maxLength={20}
              />
              {aliasError && <p className="text-xs text-red-500 font-medium">{aliasError}</p>}
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsEditingAlias(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAlias}
                  disabled={isSavingAlias || !aliasInput}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {isSavingAlias ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
                  {user?.username ? `@${user.username}` : 'No Alias Set'}
                </h2>
                <button onClick={() => { setAliasInput(user?.username || ''); setIsEditingAlias(true); }} className="text-blue-500 hover:text-blue-600 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{authEmail}</p>
            </div>
          )}
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


      {/* Privacy Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-3xl shadow-sm mb-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Parking Identity</h3>
        <p className="text-xs text-slate-500">Choose how you appear to OTHER users when you report a parking spot.</p>
        
        <div className="flex flex-col space-y-2">
          {(['public', 'anonymous', 'hidden'] as PrivacyMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => user && updatePrivacyMode(user.id, mode)}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all ${user?.privacyMode === mode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className={`text-sm font-bold capitalize ${user?.privacyMode === mode ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{mode}</span>
              <span className="text-[11px] text-slate-500 mt-1">
                {mode === 'public' && "Your alias and picture are shown."}
                {mode === 'anonymous' && "Visible as 'Anonymous'."}
                {mode === 'hidden' && "Your identity is completely hidden."}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Spot Points & Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spot Points</p>
          <p className="text-2xl font-black text-amber-500 mt-1">🟡 {spotPointsBalance.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sessions</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalSessions}</p>
        </div>
      </div>

      {/* Rewards & History Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={onNavigateToPointsHistory}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl shadow-sm text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">View History</p>
        </button>
        <button
          onClick={onNavigateToRewards}
          className="bg-blue-600 hover:bg-blue-700 p-4 rounded-2xl shadow-sm text-center transition-colors"
        >
          <p className="text-sm font-bold text-white">Rewards</p>
        </button>
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
