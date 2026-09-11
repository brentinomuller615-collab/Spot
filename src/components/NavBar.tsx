'use client';

import React from 'react';
import { useParkingSession } from '../hooks/useParkingSession';

export type TabId = 'map' | 'history' | 'profile' | 'pointsHistory' | 'rewards';

interface NavBarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export default function NavBar({ activeTab, setActiveTab }: NavBarProps) {
  const { activeSession } = useParkingSession();

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 h-16 bg-spot-cream border-2 border-spot-ink flex items-center justify-center px-2 rounded-full z-40 shadow-[0_4px_0_0_#171717] space-x-2">
      
      {/* 1. Map Tab Button */}
      <button
        onClick={() => setActiveTab('map')}
        className={`relative flex flex-col items-center justify-center w-14 h-12 transition-all duration-300 rounded-full ${
          activeTab === 'map' 
            ? 'text-white bg-spot-ink shadow-inner' 
            : 'text-spot-muted hover:text-spot-ink hover:bg-black/5'
        }`}
      >
        {activeSession && (
          <span className="absolute top-2 right-3 w-3 h-3 rounded-full bg-spot-green border-2 border-spot-cream animate-pulse"></span>
        )}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeTab === 'map' ? "2.5" : "2"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
        </svg>
      </button>

      {/* 2. History Tab Button */}
      <button
        onClick={() => setActiveTab('history')}
        className={`flex flex-col items-center justify-center w-14 h-12 transition-all duration-300 rounded-full ${
          activeTab === 'history' 
            ? 'text-white bg-spot-ink shadow-inner' 
            : 'text-spot-muted hover:text-spot-ink hover:bg-black/5'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeTab === 'history' ? "2.5" : "2"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </button>

      {/* 3. Profile Tab Button */}
      <button
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center justify-center w-14 h-12 transition-all duration-300 rounded-full ${
          activeTab === 'profile' 
            ? 'text-white bg-spot-ink shadow-inner' 
            : 'text-spot-muted hover:text-spot-ink hover:bg-black/5'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeTab === 'profile' ? "2.5" : "2"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      </button>
    </div>
  );
}
