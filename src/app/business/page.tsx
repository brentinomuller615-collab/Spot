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
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center select-none overflow-hidden">
        <div className="w-full h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-4 flex items-center justify-center animate-pulse">
            <span className="text-3xl font-black text-blue-500">S</span>
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Spot Business...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="text-slate-400 mb-6">{loadError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center select-none overflow-hidden">
        <div className="w-full h-screen bg-slate-950 flex flex-col relative overflow-hidden">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
      
      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex-shrink-0 z-20">
        <div className="p-6">
          <h1 className="text-2xl font-black tracking-tight flex items-center space-x-1.5">
            <span className="text-blue-600 dark:text-blue-500">S</span>
            <span>pot Business</span>
          </h1>
        </div>
        
        <nav className="px-4 pb-6 md:pb-0 space-y-1 overflow-x-auto md:overflow-x-visible flex md:flex-col items-center md:items-stretch whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'activity' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'}`}
          >
            Parking Activity
          </button>
          <button 
            onClick={() => setActiveTab('deals')}
            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'deals' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'}`}
          >
            Deals & Rewards
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'}`}
          >
            Settings
          </button>
          <a 
            href="/"
            className="flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white mt-auto md:mt-4"
          >
            ← Back to Spot
          </a>
          <button 
            onClick={() => signOutUser().catch(err => console.error(err))}
            className="flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-130px)] md:h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
          <h2 className="text-lg font-bold">
            {activeTab === 'overview' && 'Overview'}
            {activeTab === 'activity' && 'Parking Activity'}
            {activeTab === 'deals' && 'Deals & Rewards'}
            {activeTab === 'settings' && 'Business Settings'}
          </h2>
          <div className="flex items-center space-x-3">
            {businessProfile?.imageUrl ? (
              <img src={businessProfile.imageUrl} alt={businessProfile?.name || 'Business'} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
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
