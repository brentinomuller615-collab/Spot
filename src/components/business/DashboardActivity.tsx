import React from 'react';
import MapView from '../MapView';

export default function DashboardActivity() {
  
  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-spot-ink tracking-tight mb-2">Parking Activity</h2>
        <p className="text-spot-muted font-bold">
          Live parking intelligence around your business. Zones indicate the likelihood of finding parking.
        </p>
      </div>

      <div className="flex-1 bg-spot-cream rounded-3xl border-2 border-spot-ink shadow-[0_4px_0_0_#171717] p-2 relative overflow-hidden min-h-[500px]">
        {/* We reuse the consumer MapView component to show live likelihood and multiplayer markers */}
        <div className="w-full h-full rounded-2xl overflow-hidden relative border-2 border-spot-ink shadow-[0_2px_0_0_#171717]">
          <MapView onOpenDeals={() => {}} />
          
          {/* Status indicator overlay */}
          <div className="absolute top-6 left-6 z-20 bg-spot-yellow border-2 border-spot-ink px-4 py-2 rounded-xl shadow-[0_4px_0_0_#171717] transform -rotate-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-spot-red border-2 border-spot-ink animate-pulse"></div>
              <span className="text-xs font-black text-spot-ink uppercase tracking-widest">Live Feed Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
