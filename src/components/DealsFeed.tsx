import React, { useEffect, useState } from 'react';
import { Deal, Business } from '../lib/types';
import { getActiveDeals } from '../lib/services/dealsService';
import DealDetail from './DealDetail';
import { logDealEvent } from '../lib/services/analyticsService';

interface DealsFeedProps {
  latitude: number;
  longitude: number;
  onClose: () => void;
  onNavigate: (latitude: number, longitude: number, name: string) => void;
  userId?: string;
}

export default function DealsFeed({ latitude, longitude, onClose, onNavigate, userId }: DealsFeedProps) {
  const [dealsData, setDealsData] = useState<{deal: Deal, business: Business, distanceMeters: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<{deal: Deal, business: Business} | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    getActiveDeals(latitude, longitude)
      .then(data => {
        if (active) {
          setDealsData(data);
          setLoading(false);
          // Log impression for all fetched deals
          data.forEach(item => {
            logDealEvent({
              eventType: 'deal_impression',
              userId,
              businessId: item.business.id,
              dealId: item.deal.id,
              latitude,
              longitude,
            });
          });
        }
      })
      .catch(err => {
        console.error('Failed to load deals', err);
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [latitude, longitude, userId]);

  if (selectedDeal) {
    return (
      <DealDetail 
        deal={selectedDeal.deal} 
        business={selectedDeal.business} 
        onClose={() => setSelectedDeal(null)} 
        onNavigate={onNavigate}
        userId={userId}
      />
    );
  }

  return (
    <div className="absolute inset-0 z-40 bg-slate-50 dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300 pb-20">
      <header className="px-6 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 shadow-sm z-10">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Local Deals
        </h2>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col space-y-4 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : dealsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🏪</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">No deals nearby yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] leading-relaxed">
              Check back soon — local businesses will appear here.
            </p>
          </div>
        ) : (
          dealsData.map(({ deal, business, distanceMeters }) => (
            <div 
              key={deal.id}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden flex flex-col active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => setSelectedDeal({ deal, business })}
            >
              {business.imageUrl && (
                <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 relative">
                  <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <span className="text-white font-bold text-lg drop-shadow-md">{business.name}</span>
                    {business.rating && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                        ⭐ {business.rating}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{deal.title}</h4>
                </div>
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                  <span>{business.category}</span>
                  <span>•</span>
                  <span>{distanceMeters < 1000 ? `${Math.round(distanceMeters)} m` : `${(distanceMeters / 1000).toFixed(1)} km`} away</span>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                  {deal.description}
                </p>

                <div className="flex space-x-2">
                  <button 
                    className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-sm rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    View Deal
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
