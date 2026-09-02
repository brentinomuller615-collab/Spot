import React, { useState } from 'react';
import { User } from '../lib/types';
import { submitSpotterRating, getPublicSpotterIdentity } from '../lib/services/ratingService';
import { useParkingSession } from '../hooks/useParkingSession';

export interface HandoffOpportunity {
  id: string;
  spotter: User;
  latitude: number;
  longitude: number;
  leavingIn: string; // e.g., "2:14"
  mockRatingAverage?: number; // [MOCK] For testing without backend
  mockAccuracyPercentage?: number; // [MOCK] For testing without backend
}

interface HandoffModalProps {
  opportunity: HandoffOpportunity;
  onClose: () => void;
  onClaim: () => void;
}

export default function HandoffModal({ opportunity, onClose, onClaim }: HandoffModalProps) {
  const { user: currentUser } = useParkingSession();
  const [step, setStep] = useState<'claim' | 'rating' | 'done'>('claim');
  const [rating, setRating] = useState<number>(0);
  const [locationAccurate, setLocationAccurate] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const identity = getPublicSpotterIdentity(
    opportunity.spotter,
    opportunity.mockRatingAverage || 0,
    opportunity.mockAccuracyPercentage || 0
  );

  const handleClaim = () => {
    setStep('rating');
  };

  const handleSubmitRating = async () => {
    if (!currentUser || rating === 0 || locationAccurate === null) return;
    
    setIsSubmitting(true);
    await submitSpotterRating(
      currentUser.id,
      opportunity.spotter.id,
      opportunity.id, // using opportunity id as handoffId for V1
      rating,
      locationAccurate
    );
    setIsSubmitting(false);
    setStep('done');
    
    // Auto-close after a short delay
    setTimeout(() => {
      onClaim();
      onClose();
    }, 1500);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-auto bg-slate-950/40 backdrop-blur-sm transition-opacity">
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl overflow-hidden animate-slideUp">
        
        {/* Header (Drag handle area) */}
        <div className="w-full flex justify-center py-3" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="p-6 pt-2 pb-10">
          {step === 'claim' && (
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
                  <div className="flex items-center justify-center space-x-3 mt-1">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">⭐ {identity.ratingAverage?.toFixed(1) || 'NEW'}</span>
                    {identity.accuracyPercentage !== undefined && (
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">🎯 {identity.accuracyPercentage}% accurate</span>
                    )}
                  </div>
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
                  onClick={handleClaim}
                  className="flex-1 py-4 font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-500/30 transition-colors"
                >
                  Claim Spot
                </button>
              </div>
            </div>
          )}

          {step === 'rating' && (
            <div className="space-y-6 text-center animate-fadeIn">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                How accurate was {identity ? identity.displayName : 'this Spotter'}?
              </h3>
              
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-4xl focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  >
                    <span className={star <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-700"}>★</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Was the parking location accurate?</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setLocationAccurate(true)}
                    className={`px-6 py-2 rounded-xl font-bold border-2 transition-colors ${locationAccurate === true ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    ✅ Yes
                  </button>
                  <button
                    onClick={() => setLocationAccurate(false)}
                    className={`px-6 py-2 rounded-xl font-bold border-2 transition-colors ${locationAccurate === false ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    ❌ No
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSubmitRating}
                disabled={rating === 0 || locationAccurate === null || isSubmitting}
                className="w-full mt-6 py-4 font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-2xl shadow-lg transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="py-8 text-center animate-fadeIn">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-3xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Thanks for rating!</h3>
              <p className="text-slate-500 mt-2">Your feedback keeps Spot reliable.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
