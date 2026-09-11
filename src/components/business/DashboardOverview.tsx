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
        
        <div className="bg-spot-cream rounded-2xl border-2 border-spot-ink shadow-[0_4px_0_0_#171717] p-6 flex flex-col justify-between transition-transform hover:-translate-y-1">
          <div>
            <h3 className="text-spot-muted font-black uppercase tracking-widest text-xs mb-1">Nearby Parkers (Live)</h3>
            <p className="text-2xl font-black text-spot-ink mt-2">No live data yet</p>
          </div>
          <div className="mt-6 flex items-center text-xs font-bold text-spot-muted">
            <span>Live activity will appear here as Spot grows</span>
          </div>
        </div>

        <div className="bg-spot-yellow rounded-2xl border-2 border-spot-ink shadow-[0_4px_0_0_#171717] p-6 flex flex-col justify-between transform -rotate-1 hover:rotate-0 transition-transform">
          <div>
            <h3 className="text-spot-ink font-black uppercase tracking-widest text-xs mb-1">Deals Claimed</h3>
            <p className="text-4xl font-black text-spot-ink mt-2">0</p>
          </div>
          <div className="mt-6 flex items-center text-xs font-bold text-spot-ink/70">
            <span>No active promotions</span>
          </div>
        </div>

        <div className="bg-spot-green rounded-2xl border-2 border-spot-ink shadow-[0_4px_0_0_#171717] p-6 flex flex-col justify-between transform rotate-1 hover:rotate-0 transition-transform relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-spot-ink font-black uppercase tracking-widest text-xs mb-1">Parking Likelihood</h3>
            <p className="text-4xl font-black text-spot-ink mt-2">Mixed</p>
          </div>
          <div className="mt-6 flex items-center text-xs font-bold text-spot-ink/70 relative z-10">
            <span>Check map for details</span>
          </div>
        </div>

      </div>

      {/* Main dashboard content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Activity feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-spot-cream rounded-3xl shadow-[0_4px_0_0_#171717] border-2 border-spot-ink overflow-hidden">
            <div className="p-6 border-b-2 border-spot-ink flex justify-between items-center bg-white">
              <h3 className="font-black text-lg text-spot-ink uppercase tracking-widest">Recent Operations</h3>
            </div>
            
            <div className="p-16 text-center">
              <div className="text-5xl transform hover:scale-110 transition-transform cursor-default mb-4 inline-block">📊</div>
              <h4 className="font-black text-xl text-spot-ink mb-2">Not enough data yet</h4>
              <p className="text-sm font-bold text-spot-muted max-w-sm mx-auto">As parkers interact with your business location and claim deals, their activity will appear here.</p>
            </div>
          </div>
        </div>
        
        {/* Right column: Quick actions */}
        <div className="space-y-6">
          <div className="bg-spot-cream rounded-3xl shadow-[0_4px_0_0_#171717] border-2 border-spot-ink p-6">
            <h3 className="font-black text-lg text-spot-ink uppercase tracking-widest mb-6">Quick Actions</h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => setIsCreateDealOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-spot-ink bg-white shadow-[0_2px_0_0_#171717] active:shadow-none active:translate-y-0.5 hover:bg-spot-orange group transition-all text-left"
              >
                <div>
                  <div className="font-black text-lg text-spot-ink group-hover:text-white transition-colors leading-tight">Create a Deal</div>
                  <div className="text-xs font-bold text-spot-muted group-hover:text-white/80 mt-1 transition-colors">Offer a discount to nearby parkers</div>
                </div>
                <span className="text-spot-ink group-hover:text-white text-2xl transition-colors">→</span>
              </button>
              
              <button 
                onClick={onNavigateToSettings}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-spot-ink bg-white shadow-[0_2px_0_0_#171717] active:shadow-none active:translate-y-0.5 hover:bg-spot-orange group transition-all text-left"
              >
                <div>
                  <div className="font-black text-lg text-spot-ink group-hover:text-white transition-colors leading-tight">Update Profile</div>
                  <div className="text-xs font-bold text-spot-muted group-hover:text-white/80 mt-1 transition-colors">Edit hours and location</div>
                </div>
                <span className="text-spot-ink group-hover:text-white text-2xl transition-colors">→</span>
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
