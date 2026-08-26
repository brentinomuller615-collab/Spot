'use client';

import React from 'react';
import { useParkingSession } from '../hooks/useParkingSession';

export type TabId = 'map' | 'history' | 'profile';

interface NavBarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export default function NavBar({ activeTab, setActiveTab }: NavBarProps) {
  const { activeSession } = useParkingSession();

  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-4 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
      
      {/* 1. Map Tab Button */}
      <button
        onClick={() => setActiveTab('map')}
        className={`relative flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
          activeTab === 'map' 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
        }`}
      >
        {/* Pulsing indicator if there is an active parking session */}
        {activeSession && (
          <span className="absolute top-2.5 right-4 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900 animate-pulse"></span>
        )}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
        </svg>
        <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Map</span>
      </button>

      {/* 2. History Tab Button */}
      <button
        onClick={() => setActiveTab('history')}
        className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
          activeTab === 'history' 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">History</span>
      </button>

      {/* 3. Profile Tab Button */}
      <button
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
          activeTab === 'profile' 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Profile</span>
      </button>
    </div>
  );
}
