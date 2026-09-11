'use client';

import React, { useState } from 'react';
import OnboardingFlow from '../../components/business/OnboardingFlow';
import DashboardOverview from '../../components/business/DashboardOverview';
import DashboardActivity from '../../components/business/DashboardActivity';
import ManageDeals from '../../components/business/ManageDeals';
import BusinessSettings from '../../components/business/BusinessSettings';
import AuthView from '../../components/AuthView';
import { useParkingSession } from '../../hooks/useParkingSession';
import { signOutUser } from '../../lib/services/authService';

export type DashboardTab = 'overview' | 'activity' | 'deals' | 'settings';

export default function BusinessPage() {
  const { user, authLoading } = useParkingSession();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setIsCheckingProfile(true);
      import('../../lib/services/dealsService').then(({ getBusinessById }) => {
        getBusinessById(user.id).then((business) => {
          if (business) {
            setBusinessProfile(business);
            setIsOnboarding(false);
          } else {
            setIsOnboarding(true);
          }
          setLoadError(null);
          setIsCheckingProfile(false);
        }).catch((err) => {
          console.error(err);
          setLoadError(err.message || 'Failed to load business profile.');
          setIsCheckingProfile(false);
        });
      });
    } else {
      setIsCheckingProfile(true);
      setBusinessProfile(null);
      setIsOnboarding(false);
      setLoadError(null);
    }
  }, [user]);

  if (authLoading || (user && isCheckingProfile)) {
    return (
      <div className="min-h-screen w-full bg-spot-cream flex items-center justify-center select-none overflow-hidden">
        <div className="w-full h-screen flex flex-col justify-center items-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-spot-orange border-4 border-spot-ink shadow-[0_4px_0_0_#171717] mb-6 flex items-center justify-center animate-spin">
            <span className="text-3xl font-black text-white">S</span>
          </div>
          <span className="text-xs text-spot-ink font-black uppercase tracking-widest animate-pulse">Loading Spot Business...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen w-full bg-spot-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-spot-red text-white border-4 border-spot-ink shadow-[0_6px_0_0_#171717] rounded-full flex items-center justify-center mb-6 transform -rotate-3">
          <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-black text-spot-ink mb-2">Error Loading Dashboard</h2>
        <p className="text-sm font-bold text-spot-muted mb-8">{loadError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-spot-orange hover:bg-spot-orange/90 text-white font-black rounded-xl border-2 border-spot-ink shadow-[0_4px_0_0_#171717] active:shadow-none active:translate-y-1 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-spot-cream flex items-center justify-center select-none overflow-hidden">
        <div className="w-full h-screen flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <AuthView />
          </div>
        </div>
      </div>
    );
  }

  if (isOnboarding) {
    return <OnboardingFlow onComplete={() => setIsOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-spot-cream text-spot-ink flex flex-col md:flex-row font-sans selection:bg-spot-yellow">
      
      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-full md:w-64 bg-spot-cream border-b-2 md:border-b-0 md:border-r-2 border-spot-ink flex-shrink-0 z-20">
        <div className="p-6 pb-2 md:pb-8">
          <h1 className="text-2xl font-black tracking-tight flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-spot-orange text-white border-2 border-spot-ink flex items-center justify-center shadow-[0_2px_0_0_#171717]">S</span>
            <span>pot Business</span>
          </h1>
        </div>
        
        <nav className="px-4 pb-6 md:pb-0 space-y-2 overflow-x-auto md:overflow-x-visible flex md:flex-col items-center md:items-stretch whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center px-5 py-3 rounded-xl text-sm font-black transition-all border-2 ${activeTab === 'overview' ? 'bg-spot-orange text-white border-spot-ink shadow-[0_4px_0_0_#171717]' : 'bg-transparent text-spot-ink border-transparent hover:bg-black/5 hover:border-spot-ink/10'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex items-center px-5 py-3 rounded-xl text-sm font-black transition-all border-2 ${activeTab === 'activity' ? 'bg-spot-orange text-white border-spot-ink shadow-[0_4px_0_0_#171717]' : 'bg-transparent text-spot-ink border-transparent hover:bg-black/5 hover:border-spot-ink/10'}`}
          >
            Parking Activity
          </button>
          <button 
            onClick={() => setActiveTab('deals')}
            className={`flex items-center px-5 py-3 rounded-xl text-sm font-black transition-all border-2 ${activeTab === 'deals' ? 'bg-spot-orange text-white border-spot-ink shadow-[0_4px_0_0_#171717]' : 'bg-transparent text-spot-ink border-transparent hover:bg-black/5 hover:border-spot-ink/10'}`}
          >
            Deals & Rewards
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center px-5 py-3 rounded-xl text-sm font-black transition-all border-2 ${activeTab === 'settings' ? 'bg-spot-orange text-white border-spot-ink shadow-[0_4px_0_0_#171717]' : 'bg-transparent text-spot-ink border-transparent hover:bg-black/5 hover:border-spot-ink/10'}`}
          >
            Settings
          </button>
          
          <div className="md:mt-auto md:pt-8 w-full"></div>
          
          <a 
            href="/"
            className="flex items-center px-5 py-3 rounded-xl text-sm font-black text-spot-muted hover:bg-black/5 hover:text-spot-ink transition-all border-2 border-transparent"
          >
            ← Back to Spot
          </a>
          <button 
            onClick={() => signOutUser().catch(err => console.error(err))}
            className="flex items-center px-5 py-3 rounded-xl text-sm font-black text-spot-red hover:bg-spot-red/10 transition-all border-2 border-transparent"
          >
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-130px)] md:h-screen overflow-hidden bg-white/50">
        {/* Top Header */}
        <header className="h-20 bg-spot-cream border-b-2 border-spot-ink flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
          <h2 className="text-2xl font-black text-spot-ink tracking-tight">
            {activeTab === 'overview' && 'Overview'}
            {activeTab === 'activity' && 'Parking Activity'}
            {activeTab === 'deals' && 'Deals & Rewards'}
            {activeTab === 'settings' && 'Business Settings'}
          </h2>
          <div className="flex items-center space-x-3">
            {businessProfile?.imageUrl ? (
              <img src={businessProfile.imageUrl} alt={businessProfile?.name || 'Business'} className="w-10 h-10 rounded-full object-cover border-2 border-spot-ink shadow-[0_2px_0_0_#171717]" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-spot-yellow text-spot-ink border-2 border-spot-ink shadow-[0_2px_0_0_#171717] flex items-center justify-center font-black text-sm">
                {businessProfile?.name ? businessProfile.name.substring(0, 2).toUpperCase() : 'TB'}
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Views */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {activeTab === 'overview' && <DashboardOverview onNavigateToSettings={() => setActiveTab('settings')} onNavigateToDeals={() => setActiveTab('deals')} />}
            {activeTab === 'activity' && <DashboardActivity />}
            
            {activeTab === 'deals' && (
              <ManageDeals businessId={user.id} />
            )}

            {activeTab === 'settings' && (
              <BusinessSettings 
                businessProfile={businessProfile} 
                onUpdate={(updated) => setBusinessProfile(updated)} 
              />
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
