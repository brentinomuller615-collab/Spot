import React from 'react';
import { User } from '../lib/types';
import { getPublicSpotterIdentity } from '../lib/services/ratingService';

export interface HandoffOpportunity {
  id: string;
  spotter: User;
  latitude: number;
  longitude: number;
  leavingIn: string; // e.g., "2:14"
}

interface HandoffModalProps {
  opportunity: HandoffOpportunity;
  onClose: () => void;
  onClaim: () => void;
}

export default function HandoffModal({ opportunity, onClose, onClaim }: HandoffModalProps) {
  const identity = getPublicSpotterIdentity(opportunity.spotter);

  const handleNavigate = () => {
    // Open in default maps app
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${opportunity.latitude},${opportunity.longitude}`, '_blank');
    onClaim();
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-auto bg-slate-950/40 backdrop-blur-sm transition-opacity">
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl overflow-hidden animate-slideUp">
        
        {/* Header (Drag handle area) */}
        <div className="w-full flex justify-center py-3" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="p-6 pt-2 pb-10">
          <div className="space-y-6 text-center">
            {identity ? (
              <div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl overflow-hidden border border-blue-200 dark:border-blue-800">
                  {identity.displayImageUrl ? (
                    <img src={identity.displayImageUrl} alt="Spotter" className="w-full h-full object-cover" />
                  ) : (
                    identity.displayName.replace('@', '').substring(0, 2).toUpperCase()
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                  {identity.displayName}
                </h3>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                  🚗
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Parking opportunity</h3>
              </div>
            )}
            
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 py-3 rounded-2xl">
              <p className="text-amber-800 dark:text-amber-400 font-bold text-lg animate-pulse">
                Leaving in {opportunity.leavingIn}
              </p>
            </div>

            <div className="flex space-x-3 mt-6">
              <button 
                onClick={onClose}
                className="flex-1 py-4 font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl"
              >
                Ignore
              </button>
              <button 
                onClick={handleNavigate}
                className="flex-1 py-4 font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-500/30 transition-colors"
              >
                Navigate to Spot
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
