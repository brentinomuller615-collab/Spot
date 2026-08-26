'use client';

import React, { useState } from 'react';
import MapView from '../components/MapView';
import SearchBar from '../components/SearchBar';
import ParkingFlow from '../components/ParkingFlow';
import HistoryView from '../components/HistoryView';
import ProfileView from '../components/ProfileView';
import NavBar, { TabId } from '../components/NavBar';
import AuthView from '../components/AuthView';
import { useParkingSession } from '../hooks/useParkingSession';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('map');
  const { user, authLoading } = useParkingSession();

  const handleNavigateToMap = () => {
    setActiveTab('map');
  };

  if (authLoading) {
    return (
      <main className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-0 md:p-6 select-none overflow-hidden">
        <div className="w-full h-screen md:h-[840px] md:max-w-md md:rounded-[40px] md:shadow-2xl md:border-[10px] md:border-slate-800 bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-4 flex items-center justify-center animate-pulse">
            <span className="text-3xl font-black text-blue-500">S</span>
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Spot...</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-0 md:p-6 select-none overflow-hidden">
        <div className="w-full h-screen md:h-[840px] md:max-w-md md:rounded-[40px] md:shadow-2xl md:border-[10px] md:border-slate-800 bg-slate-950 flex flex-col relative overflow-hidden">
          {/* Status Bar simulation */}
          <div className="h-6 w-full bg-slate-950 flex justify-between items-center px-6 text-[10px] font-bold text-slate-500 z-30 select-none">
            <span>09:41</span>
            <div className="flex items-center space-x-1.5">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3c-1.2 0-2.4.4-3.4 1.2L2.7 9.8c-.8.6-.8 1.8 0 2.4l5.9 5.6c1 .8 2.2 1.2 3.4 1.2s2.4-.4 3.4-1.2l5.9-5.6c.8-.6.8-1.8 0-2.4l-5.9-5.6c-1-.8-2.2-1.2-3.4-1.2z" opacity="0.3"/>
                <path d="M12 6c-.8 0-1.6.3-2.2.8l-5.9 5.6c-.4.4-.4 1.1 0 1.5l5.9 5.6c.6.5 1.4.8 2.2.8s1.6-.3 2.2-.8l5.9-5.6c.4-.4.4-1.1 0-1.5l-5.9-5.6C13.6 6.3 12.8 6 12 6z"/>
              </svg>
              <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-3.5 bg-slate-500 rounded-[1px]"></div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <AuthView />
          </div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-full z-30 pointer-events-none hidden md:block"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-0 md:p-6 select-none overflow-hidden">

      
      {/* Immersive Phone Frame Mockup for Desktop */}
      <div className="w-full h-screen md:h-[840px] md:max-w-md md:rounded-[40px] md:shadow-2xl md:border-[10px] md:border-slate-800 dark:md:border-slate-850 bg-white dark:bg-slate-950 flex flex-col relative overflow-hidden transition-all duration-300">
        
        {/* Status Bar simulation on mobile/desktop */}
        <div className="h-6 w-full bg-white dark:bg-slate-900 flex justify-between items-center px-6 text-[10px] font-bold text-slate-500 z-30 select-none">
          <span>09:41</span>
          <div className="flex items-center space-x-1.5">
            {/* Cell signal */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3c-1.2 0-2.4.4-3.4 1.2L2.7 9.8c-.8.6-.8 1.8 0 2.4l5.9 5.6c1 .8 2.2 1.2 3.4 1.2s2.4-.4 3.4-1.2l5.9-5.6c.8-.6.8-1.8 0-2.4l-5.9-5.6c-1-.8-2.2-1.2-3.4-1.2z" opacity="0.3"/>
              <path d="M12 6c-.8 0-1.6.3-2.2.8l-5.9 5.6c-.4.4-.4 1.1 0 1.5l5.9 5.6c.6.5 1.4.8 2.2.8s1.6-.3 2.2-.8l5.9-5.6c.4-.4.4-1.1 0-1.5l-5.9-5.6C13.6 6.3 12.8 6 12 6z"/>
            </svg>
            {/* Battery */}
            <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
              <div className="h-full w-3.5 bg-slate-500 rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* Header Section */}
        {activeTab !== 'map' && (
          <header className="py-4 px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center z-20 shadow-sm">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-1.5">
              <span className="text-blue-600 dark:text-blue-500">S</span>
              <span className="text-slate-800 dark:text-slate-200">pot</span>
            </h1>
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">★ {user.points} pts</span>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <div className="flex-1 w-full relative overflow-hidden bg-slate-50 dark:bg-slate-950">
          
          {/* TAB RENDERER */}
          {activeTab === 'map' && (
            <div className="w-full h-full relative">
              <SearchBar />
              <MapView />
              <ParkingFlow />
            </div>
          )}

          {activeTab === 'history' && <HistoryView />}

          {activeTab === 'profile' && (
            <ProfileView onNavigateToMap={handleNavigateToMap} />
          )}

        </div>

        {/* Bottom Tab Bar Navigation */}
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Home indicator bar (iPhone mock) */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 dark:bg-slate-800 rounded-full z-30 pointer-events-none hidden md:block"></div>
      </div>
    </main>
  );
}
