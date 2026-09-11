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
  
  const isHidden = !identity || identity.displayName === '?';
  const displayName = identity?.displayName || '?';
  const displayInitial = isHidden ? '?' : (displayName.replace('@', '').charAt(0).toUpperCase() || 'S');

  const handleNavigate = () => {
    // Open in default maps app
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${opportunity.latitude},${opportunity.longitude}`, '_blank');
    onClaim();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-spot-ink/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-spot-cream w-full max-w-sm rounded-[2rem] border-2 border-spot-ink shadow-[0_8px_0_0_#171717] overflow-hidden relative transform transition-all">
        
        {/* Playful Header */}
        <div className="bg-spot-green p-6 flex flex-col items-center justify-center relative border-b-2 border-spot-ink">
          
          <div className="relative z-10 w-20 h-20 bg-spot-cream border-4 border-spot-ink rounded-full flex items-center justify-center text-spot-ink shadow-[0_4px_0_0_#171717] mb-4 transform -rotate-3 hover:rotate-0 transition-transform">
            {identity?.displayImageUrl ? (
              <img src={identity.displayImageUrl} alt="Spotter" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-3xl font-black">{displayInitial}</span>
            )}
          </div>
          
          <h2 className="text-2xl font-black text-spot-ink tracking-tight relative z-10">
            {displayName !== '?' ? `@${displayName}` : 'Anonymous'}
          </h2>
          <div className="mt-2 px-4 py-1.5 bg-white border-2 border-spot-ink rounded-full shadow-[0_2px_0_0_#171717]">
            <p className="text-xs font-black text-spot-ink tracking-widest uppercase flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-spot-red animate-ping"></span>
              <span>Just left</span>
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-spot-ink transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center">
          <h3 className="text-xl font-black text-spot-ink mb-2 leading-tight">This spot was just vacated!</h3>
          <p className="text-sm text-spot-muted font-bold mb-6">
            Head there now to claim it before someone else does.
          </p>

          <div className="flex flex-col space-y-4">
            <button
              onClick={handleNavigate}
              className="w-full py-4 bg-spot-orange text-white font-black rounded-2xl border-2 border-spot-ink shadow-[0_4px_0_0_#171717] active:shadow-none active:translate-y-1 transition-all duration-200"
            >
              Navigate to Spot
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-white text-spot-ink font-black rounded-2xl border-2 border-spot-ink/10 hover:border-spot-ink/30 hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
