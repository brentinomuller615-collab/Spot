import React, { useEffect } from 'react';
import { Deal, Business } from '../lib/types';
import { logDealEvent } from '../lib/services/analyticsService';

interface DealDetailProps {
  deal: Deal;
  business: Business;
  onClose: () => void;
  onNavigate: (latitude: number, longitude: number, name: string) => void;
  userId?: string;
}

export default function DealDetail({ deal, business, onClose, onNavigate, userId }: DealDetailProps) {
  useEffect(() => {
    logDealEvent({
      eventType: 'deal_opened',
      userId,
      businessId: business.id,
      dealId: deal.id,
    });
  }, [deal.id, business.id, userId]);

  const handleNavigate = () => {
    logDealEvent({
      eventType: 'deal_navigate_clicked',
      userId,
      businessId: business.id,
      dealId: deal.id,
    });
    onNavigate(business.latitude, business.longitude, business.name);
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      <div className="relative w-full h-64 bg-slate-200 dark:bg-slate-800 shrink-0">
        {deal.imageUrl ? (
          <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover" />
        ) : business.imageUrl ? (
          <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200 dark:bg-slate-800">
            No Image Available
          </div>
        )}
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {business.name}
          </h2>
          {business.rating && (
            <div className="flex items-center space-x-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg text-sm font-bold">
              <span>⭐</span>
              <span>{business.rating}</span>
            </div>
          )}
        </div>
        
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{business.category}</p>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 mb-6 border border-blue-100 dark:border-blue-800/50">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
            {deal.title}
          </h3>
          <p className="text-sm text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
            {deal.description}
          </p>
        </div>

        <div className="mt-auto pt-6 pb-20">
          <button 
            onClick={handleNavigate}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Navigate Here</span>
          </button>
        </div>
      </div>
    </div>
  );
}
