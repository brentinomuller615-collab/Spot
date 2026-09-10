import React from 'react';
import MapView from '../MapView';

export default function DashboardActivity() {
  
  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Parking Activity</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Live parking intelligence around your business. Zones indicate the likelihood of finding parking.
        </p>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-2 relative overflow-hidden min-h-[500px]">
        {/* We reuse the consumer MapView component to show live likelihood and multiplayer markers */}
        <div className="w-full h-full rounded-xl overflow-hidden relative">
          <MapView onOpenDeals={() => {}} />
          
          {/* Overlay gradient to make it feel like a dashboard module rather than the full app */}
          <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10" />
          
          {/* Status indicator overlay */}
          <div className="absolute top-4 left-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Live Feed Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
