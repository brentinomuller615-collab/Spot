import React, { useState } from 'react';
import CreateDealModal from './CreateDealModal';
import { useParkingSession } from '../../hooks/useParkingSession';

interface DashboardOverviewProps {
  onNavigateToSettings?: () => void;
  onNavigateToDeals?: () => void;
}

export default function DashboardOverview({ onNavigateToSettings, onNavigateToDeals }: DashboardOverviewProps) {
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false);
  const { user } = useParkingSession();

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-1">Nearby Parkers (Live)</h3>
            <p className="text-xl font-bold text-slate-400 mt-2">No live activity data yet</p>
          </div>
          <div className="mt-4 flex items-center text-sm font-semibold text-slate-500">
            <span>Live activity will appear here as Spot grows</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-1">Deals Claimed</h3>
            <p className="text-3xl font-black">0</p>
          </div>
          <div className="mt-4 flex items-center text-sm font-semibold text-slate-400">
            <span>No active promotions</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-sm p-6 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-blue-100 font-semibold text-sm mb-1">Parking Likelihood</h3>
            <p className="text-3xl font-black text-white">Mixed</p>
          </div>
          <div className="mt-4 flex items-center text-sm font-semibold text-blue-100 relative z-10">
            <span>Check map for details</span>
          </div>
          {/* Decorative background elements */}
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        </div>

      </div>

      {/* Main dashboard content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Activity feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg">Recent Operations</h3>
            </div>
            
            <div className="p-12 text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Not enough data yet</h4>
              <p className="text-sm max-w-sm mx-auto">As parkers interact with your business location and claim deals, their activity will appear here.</p>
            </div>
          </div>
        </div>
        
        {/* Right column: Quick actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => setIsCreateDealOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Create a Deal</div>
                  <div className="text-xs text-slate-500 mt-0.5">Offer a discount to nearby parkers</div>
                </div>
                <span className="text-slate-400 group-hover:text-blue-600 transition-colors">→</span>
              </button>
              
              <button 
                onClick={onNavigateToSettings}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Update Profile</div>
                  <div className="text-xs text-slate-500 mt-0.5">Edit hours and location</div>
                </div>
                <span className="text-slate-400 group-hover:text-blue-600 transition-colors">→</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {isCreateDealOpen && (
        <CreateDealModal 
          businessId={user?.id || ''} 
          onClose={() => setIsCreateDealOpen(false)} 
          onSuccess={() => {
            if (onNavigateToDeals) {
              onNavigateToDeals();
            }
          }} 
        />
      )}
    </div>
  );
}
