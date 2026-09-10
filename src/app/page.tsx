'use client';

import React, { useState } from 'react';
import MapView from '../components/MapView';
import SearchBar from '../components/SearchBar';
import ParkingFlow from '../components/ParkingFlow';
import HistoryView from '../components/HistoryView';
import ProfileView from '../components/ProfileView';
import NavBar, { TabId } from '../components/NavBar';
import AuthView from '../components/AuthView';
import DealsFeed from '../components/DealsFeed';
import PointsHistoryView from '../components/PointsHistoryView';
import RewardsView from '../components/RewardsView';
import { useParkingSession } from '../hooks/useParkingSession';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('map');
  const [isDealsOpen, setIsDealsOpen] = useState(false);
  const { user, authLoading, currentLocation, selectDestination } = useParkingSession();

  const handleNavigateToMap = () => {
    setActiveTab('map');
  };

  if (authLoading) {
    return (
      <main className="min-h-screen w-full bg-slate-900 flex items-center justify-center select-none overflow-hidden">
        <div className="w-full h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
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
      <main className="min-h-screen w-full bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center select-none overflow-hidden">
        <div className="w-full h-screen bg-slate-950 flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <AuthView />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center select-none overflow-hidden">
      
      {/* Real Responsive Web App Layout */}
      <div className="w-full h-screen bg-white dark:bg-slate-950 flex flex-col relative overflow-hidden transition-all duration-300">

        {/* Header Section */}
        {['history', 'profile'].includes(activeTab) && (
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
              <MapView onOpenDeals={() => setIsDealsOpen(true)} />
              <ParkingFlow />
              
              {isDealsOpen && currentLocation && (
                <DealsFeed 
                  latitude={currentLocation.latitude}
                  longitude={currentLocation.longitude}
                  userId={user.id}
                  onClose={() => setIsDealsOpen(false)}
                  onNavigate={(lat, lng, name) => {
                    setIsDealsOpen(false);
                    selectDestination({
                      id: `business-${Date.now()}`,
                      name: name,
                      latitude: lat,
                      longitude: lng,
                      zones: [] // Let the parking likelihood service handle zones dynamically
                    });
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'history' && <HistoryView />}

          {activeTab === 'profile' && (
            <ProfileView 
              onNavigateToMap={handleNavigateToMap}
              onNavigateToPointsHistory={() => setActiveTab('pointsHistory')}
              onNavigateToRewards={() => setActiveTab('rewards')}
            />
          )}

          {activeTab === 'pointsHistory' && (
            <PointsHistoryView onBack={() => setActiveTab('profile')} />
          )}

          {activeTab === 'rewards' && (
            <RewardsView onBack={() => setActiveTab('profile')} />
          )}

        </div>

        {/* Bottom Tab Bar Navigation */}
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </main>
  );
}
