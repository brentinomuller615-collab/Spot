'use client';

import React, { useState, useEffect } from 'react';
import { useParkingSession } from '../hooks/useParkingSession';
import { signOutUser } from '../lib/services/authService';
import { updateUsername, updatePrivacyMode, updateProfileImage } from '../lib/services/userService';
import { getSpotPointsBalance } from '../lib/services/pointsService';
import { PrivacyMode } from '../lib/types';
import { uploadDealImageToCloudinary } from '../lib/services/cloudinaryService';

interface ProfileViewProps {
  onNavigateToMap: () => void;
  onNavigateToPointsHistory: () => void;
  onNavigateToRewards: () => void;
}

export default function ProfileView({ onNavigateToMap, onNavigateToPointsHistory, onNavigateToRewards }: ProfileViewProps) {
  const { user, authEmail, history, activeSession } = useParkingSession();
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [aliasError, setAliasError] = useState('');
  const [isSavingAlias, setIsSavingAlias] = useState(false);
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploadingImage(true);
    setImageUploadError('');
    
    try {
      const url = await uploadDealImageToCloudinary(file);
      await updateProfileImage(user.id, url);
    } catch (err: any) {
      console.error("Image upload error:", err);
      setImageUploadError(err.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  const [spotPointsBalance, setSpotPointsBalance] = useState(0);

  useEffect(() => {
    if (user?.id) {
      getSpotPointsBalance(user.id).then(setSpotPointsBalance).catch(console.error);
    }
  }, [user?.id]);

  const totalSessions = history.length + (activeSession ? 1 : 0);

  const handleSaveAlias = async () => {
    if (!user) return;
    setAliasError('');
    setIsSavingAlias(true);
    
    try {
      const success = await updateUsername(user.id, aliasInput);
      if (success) {
        setIsEditingAlias(false);
      } else {
        setAliasError('Username already taken');
      }
    } catch (err: any) {
      console.error("Save alias error:", err);
      setAliasError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSavingAlias(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-spot-cream px-6 pt-12 pb-28 overflow-y-auto">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-10 text-center">
        <label className={`relative w-32 h-32 shrink-0 group cursor-pointer block mb-6 ${isUploadingImage ? 'pointer-events-none' : ''}`}>
          <div className="w-32 h-32 rounded-full bg-spot-cream border-4 border-spot-ink flex items-center justify-center text-spot-ink font-black text-5xl shadow-[0_8px_0_0_#171717] overflow-hidden">
            {isUploadingImage ? (
              <span className="w-10 h-10 border-4 border-spot-orange border-t-transparent rounded-full animate-spin"></span>
            ) : user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.username ? user.username.substring(0, 2).toUpperCase() : 'SP'
            )}
          </div>
          
          <div className="absolute inset-0 rounded-full bg-spot-ink/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
        </label>
        {imageUploadError && <p className="text-[10px] text-red-500 font-bold mt-2">{imageUploadError}</p>}
        
        <div className="w-full">
          {isEditingAlias ? (
            <div className="flex flex-col space-y-4 max-w-[200px] mx-auto mt-2">
              <input 
                type="text" 
                className="w-full bg-transparent border-b-4 border-spot-orange px-2 py-1 text-center text-2xl font-black text-spot-ink focus:outline-none placeholder-spot-muted"
                placeholder="Unique alias"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                maxLength={20}
              />
              {aliasError && <p className="text-xs text-spot-red font-black">{aliasError}</p>}
              <div className="flex space-x-3 justify-center pt-2">
                <button 
                  onClick={() => setIsEditingAlias(false)}
                  className="px-5 py-2.5 text-xs font-black text-spot-ink bg-spot-cream border-2 border-spot-ink/20 rounded-full hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAlias}
                  disabled={isSavingAlias || !aliasInput}
                  className="px-6 py-2.5 text-xs font-black bg-spot-ink text-white rounded-full shadow-[0_3px_0_0_#FF5A36] disabled:opacity-50 transition-transform active:translate-y-1 active:shadow-none"
                >
                  {isSavingAlias ? '...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2 group">
                <h2 className="text-4xl font-black tracking-tight text-spot-ink truncate max-w-[250px]">
                  {user?.username ? `@${user.username}` : 'No Alias'}
                </h2>
                <button onClick={() => { setAliasInput(user?.username || ''); setIsEditingAlias(true); }} className="text-spot-muted hover:text-spot-orange transition-colors opacity-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
              </div>
              <p className="text-sm font-bold text-spot-muted mt-1 truncate">{authEmail}</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Session Callout */}
      {activeSession && (
        <div className="bg-white border-2 border-spot-ink rounded-3xl p-5 mb-8 text-spot-ink flex items-center justify-between shadow-[0_4px_0_0_#171717]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-spot-red animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-spot-red">Active Session</span>
            </div>
            <p className="text-sm font-black mt-1 truncate max-w-[180px]">{activeSession.locationName}</p>
          </div>
          <button
            onClick={onNavigateToMap}
            className="text-xs font-black bg-spot-yellow text-spot-ink border-2 border-spot-ink shadow-[0_2px_0_0_#171717] hover:translate-y-px hover:shadow-none transition-all px-4 py-2.5 rounded-xl"
          >
            Show on Map
          </button>
        </div>
      )}


      {/* Spot Points & Stats */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="flex flex-col items-center">
          <p className="text-xs font-black text-spot-muted uppercase tracking-widest mb-1">Spot Points</p>
          <p className="text-5xl font-black text-spot-orange">{spotPointsBalance.toLocaleString()}</p>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-xs font-black text-spot-muted uppercase tracking-widest mb-1">Sessions</p>
          <p className="text-5xl font-black text-spot-ink">{totalSessions}</p>
        </div>
      </div>

      {/* Rewards & History Actions */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <button
          onClick={onNavigateToPointsHistory}
          className="py-4 rounded-2xl bg-spot-cream border-2 border-spot-ink shadow-[0_4px_0_0_#171717] active:shadow-none active:translate-y-1 text-spot-ink font-black transition-all"
        >
          View History
        </button>
        <button
          onClick={onNavigateToRewards}
          className="py-4 rounded-2xl bg-spot-yellow border-2 border-spot-ink shadow-[0_4px_0_0_#171717] active:shadow-none active:translate-y-1 text-spot-ink font-black transition-all"
        >
          Rewards
        </button>
      </div>

      {/* Privacy Settings */}
      <div className="mb-10 space-y-5">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-spot-ink mb-1">Parking Identity</h3>
          <p className="text-xs text-spot-muted font-bold">How others see you on the map.</p>
        </div>
        
        <div className="flex flex-col space-y-3">
          {(['public', 'anonymous', 'hidden'] as PrivacyMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => user && updatePrivacyMode(user.id, mode)}
              className={`flex flex-col text-left p-5 rounded-2xl transition-all border-2 ${
                user?.privacyMode === mode 
                  ? 'bg-spot-yellow/20 border-spot-ink shadow-[0_4px_0_0_#171717]' 
                  : 'bg-white border-spot-ink/10 hover:border-spot-ink/40'
              }`}
            >
              <span className={`text-sm font-black capitalize ${user?.privacyMode === mode ? 'text-spot-ink' : 'text-spot-ink/70'}`}>{mode}</span>
              <span className="text-[11px] font-bold text-spot-muted mt-1">
                {mode === 'public' && "Your alias and picture are shown."}
                {mode === 'anonymous' && "Visible as 'Anonymous'."}
                {mode === 'hidden' && "Your identity is completely hidden."}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Help section */}
      <div className="mb-10">
        <h3 className="text-sm font-black uppercase tracking-widest text-spot-ink mb-5">How it works</h3>
        <div className="space-y-5">
          <div className="flex items-start space-x-4">
            <div className="text-2xl">📍</div>
            <div>
              <h4 className="text-sm font-black text-spot-ink">Park your car</h4>
              <p className="text-xs text-spot-muted font-bold mt-1 leading-relaxed">Tap "I'm Parked" to claim your spot on the map.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="text-2xl">🏃</div>
            <div>
              <h4 className="text-sm font-black text-spot-ink">Leave and Earn</h4>
              <p className="text-xs text-spot-muted font-bold mt-1 leading-relaxed">Tap "I'm Leaving" to free the slot and get +10 points.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spot for Business CTA */}
      <div className="mb-10 pt-8 border-t-2 border-spot-ink/10">
        <a 
          href="/business" 
          className="flex items-center justify-between p-5 bg-spot-ink text-white rounded-3xl hover:-translate-y-1 hover:shadow-[0_4px_0_0_#FF5A36] transition-all border-2 border-spot-ink"
        >
          <div>
            <h3 className="text-base font-black">For Businesses</h3>
            <p className="text-xs font-bold text-white/70">List your parking deals</p>
          </div>
          <span className="text-2xl">🏢</span>
        </a>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={() => signOutUser().catch(err => console.error(err))}
        className="w-full py-4 bg-transparent hover:bg-red-500/10 text-red-500 font-bold rounded-full text-xs transition-colors mb-8"
      >
        Sign Out
      </button>
    </div>
  );
}
