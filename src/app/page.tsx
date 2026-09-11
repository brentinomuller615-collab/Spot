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
      <main className="min-h-screen w-full bg-spot-cream flex items-center justify-center select-none overflow-hidden">
        <div className="w-full h-screen bg-spot-cream flex flex-col justify-center items-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-spot-orange mb-4 flex items-center justify-center animate-pulse">
            <span className="text-3xl font-black text-white">S</span>
          </div>
          <span className="text-xs text-spot-muted font-bold uppercase tracking-widest animate-pulse">Loading Spot...</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full bg-spot-cream flex items-center justify-center select-none overflow-hidden">
        <div className="w-full h-screen bg-spot-cream flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <AuthView />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-spot-cream text-spot-ink flex items-center justify-center select-none overflow-hidden">
      
      {/* Real Responsive Web App Layout */}
      <div className="w-full h-screen bg-spot-cream flex flex-col relative overflow-hidden transition-all duration-300">

        {/* Main Content Area */}
        <div className="flex-1 w-full relative overflow-hidden bg-spot-cream">
          
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
