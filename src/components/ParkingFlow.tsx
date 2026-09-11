'use client';

import React, { useState, useEffect } from 'react';
import { useParkingSession } from '../hooks/useParkingSession';
import { GeolocationResult, GeolocationError } from '../lib/services/geolocationService';
import { calculateDistanceMeters } from '../lib/utils/geo';
import { fetchMunicipalParking } from '../lib/services/municipalParkingService';

// Flow states:
// 'idle'               - default: show "I'm Parked" button (or active session card)
// 'acquiring_location' - GPS in progress, show spinner
// 'location_error'     - GPS failed, show error message with retry
// 'selecting_duration' - GPS succeeded, show location + duration picker
// 'creating_session'   - Firestore addDoc in flight
// 'create_error'       - Firestore addDoc failed; user can retry
// 'completing_session' - Firestore update in flight
// 'complete_error'     - Firestore update failed; user can retry
// 'confirm_leaving'    - confirmation panel before ending session
type FlowState = 'idle' | 'acquiring_location' | 'location_error' | 'selecting_duration' | 'creating_session' | 'create_error' | 'completing_session' | 'complete_error' | 'confirm_leaving';

const durations = ['15 min', '30 min', '1 hour', '2 hours', '3+ hours', 'Skip'];

export default function ParkingFlow() {
  const {
    activeSession,
    selectedDestination,
    currentLocation,
    startParking,
    confirmEndParking,
    earnedPointsNotification,
    dismissPointNotification,
    refreshLocation,
  } = useParkingSession();

  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');

  // Captured real GPS position — set once geolocation succeeds
  const [gpsPosition, setGpsPosition] = useState<GeolocationResult | null>(null);
  // Error from the geolocation API
  const [gpsError, setGpsError] = useState<GeolocationError | null>(null);
  // Human readable address retrieved via reverse geocoding
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);

  // Elapsed timer for active parking session
  useEffect(() => {
    if (!activeSession) {
      setElapsedTime('00:00');
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(activeSession.startedAt).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - start);
      const diffSecs = Math.floor(diffMs / 1000);

      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;
      const pad = (n: number) => String(n).padStart(2, '0');

      return hours > 0
        ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
        : `${pad(minutes)}:${pad(seconds)}`;
    };

    setElapsedTime(calculateElapsed());
    const interval = setInterval(() => setElapsedTime(calculateElapsed()), 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStartParkingClick = async () => {
    setGpsPosition(null);
    setGpsError(null);

    try {
      setFlowState('acquiring_location');
      
      const position = await refreshLocation();

      setGpsPosition(position);
      setFlowState('selecting_duration');

      // Async reverse geocode position to find address name
      try {
        const { geocoding, config } = require('@maptiler/client');
        config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
        const res = await geocoding.reverse([position.longitude, position.latitude]);
        if (res && res.features && res.features.length > 0) {
          setGpsAddress(res.features[0].place_name);
        }
      } catch (geocodeErr) {
        console.error('Reverse geocoding failed:', geocodeErr);
      }
    } catch (err) {
      setGpsError(err as GeolocationError);
      setFlowState('location_error');
    }
  };

  // Retry GPS acquisition from the error state
  const handleRetryLocation = () => {
    handleStartParkingClick();
  };

  // User confirms parking — await the Firestore write directly
  const handleConfirmStart = async () => {
    if (!gpsPosition) return;

    // Capture before clearing state
    const capturedPosition = gpsPosition;
    const capturedDuration = selectedDuration;

    // The location name comes from the reverse geocoded address, 
    // or falls back to destination name / current mock name.
    const locationName = gpsAddress
      ? gpsAddress
      : (selectedDestination ? selectedDestination.name : (currentLocation?.name || 'Current Location'));

    setFlowState('creating_session');
    setSelectedDuration(null);
    setGpsPosition(null);
    setGpsAddress(null); // Clear address state

    try {
      // Find nearest municipal parking location within 50m
      let nearestMunicipalId: number | undefined = undefined;
      try {
        const locations = await fetchMunicipalParking();
        let minDistance = Infinity;
        for (const loc of locations) {
          const dist = calculateDistanceMeters(
            capturedPosition.latitude,
            capturedPosition.longitude,
            loc.latitude,
            loc.longitude
          );
          if (dist <= 50 && dist < minDistance) {
            minDistance = dist;
            nearestMunicipalId = loc.id;
          }
        }
      } catch (err) {
        console.warn('Could not find nearest municipal location:', err);
      }

      // startParking is now async: awaits addDoc and immediately sets activeSession
      // in the provider — no need to wait for onSnapshot.
      await startParking(
        locationName,
        capturedPosition.latitude,   // real GPS latitude
        capturedPosition.longitude,  // real GPS longitude
        capturedDuration || 'Skip',
        nearestMunicipalId           // associated municipal infrastructure ID
      );
      // activeSession is already set; show the active session card immediately
      setFlowState('idle');
    } catch (err) {
      console.error('Failed to create parking session:', err);
      // Restore position so the user can retry from selecting_duration
      setGpsPosition(capturedPosition);
      setSelectedDuration(capturedDuration);
      setFlowState('create_error');
    }
  };

  const handleImLeavingClick = () => setFlowState('confirm_leaving');

  const handleConfirmLeaving = async () => {
    setFlowState('completing_session');
    try {
      await confirmEndParking();
      setFlowState('idle');
    } catch (err) {
      console.error('Failed to complete parking session:', err);
      setFlowState('complete_error');
    }
  };

  const handleCancel = () => {
    setFlowState('idle');
    setGpsPosition(null);
    setGpsError(null);
    setGpsAddress(null);
    setSelectedDuration(null);
  };

  // Format coordinates for display
  const formatCoord = (n: number, decimals = 5) => n.toFixed(decimals);

  return (
    <div className="absolute bottom-20 left-4 right-4 z-20 transition-all duration-300">

      {/* POINTS EARNED NOTIFICATION */}
      {earnedPointsNotification !== null && (
        <div className="bg-emerald-600 text-white rounded-2xl shadow-xl p-6 border border-emerald-500 text-center animate-bounce mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold">Parking session complete</h3>
          <p className="text-3xl font-extrabold mt-1">+{earnedPointsNotification} Spot Points</p>
          <button
            onClick={dismissPointNotification}
            className="mt-4 px-6 py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-sm font-bold transition-colors w-full"
          >
            Awesome!
          </button>
        </div>
      )}

      {/* ACQUIRING LOCATION — loading spinner */}
      {flowState === 'acquiring_location' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <span className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin block"></span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Detecting your location…</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please allow location access when prompted.</p>
          <button
            onClick={handleCancel}
            className="mt-4 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold transition-colors relative z-10"
          >
            Cancel
          </button>
        </div>
      )}

      {/* CREATING SESSION — Firestore addDoc in flight */}
      {flowState === 'creating_session' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <span className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin block"></span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Starting your session…</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Saving your parking location.</p>
        </div>
      )}

      {/* CREATE ERROR — Firestore write failed */}
      {flowState === 'create_error' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-red-100 dark:border-red-900/40">
          <div className="w-10 h-10 mx-auto mb-3 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-center mb-1">Couldn't save session</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            There was a problem saving your parking session. Please check your connection and try again.
          </p>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setFlowState('selecting_duration')}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* COMPLETING SESSION — Firestore update in flight */}
      {flowState === 'completing_session' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <span className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin block"></span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Completing your session…</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Updating parking slot status.</p>
        </div>
      )}

      {/* COMPLETE ERROR — Firestore update failed */}
      {flowState === 'complete_error' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-red-100 dark:border-red-900/40">
          <div className="w-10 h-10 mx-auto mb-3 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-center mb-1">Couldn't complete session</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            There was a problem completing your parking session. Please try again.
          </p>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setFlowState('confirm_leaving')}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}


      {/* LOCATION ERROR */}
      {flowState === 'location_error' && gpsError && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-red-100 dark:border-red-900/40">
          <div className="w-10 h-10 mx-auto mb-3 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 text-center mb-1">
            {gpsError.type === 'permission_denied' ? 'Location Access Denied' : 'Location Unavailable'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            {gpsError.message}
          </p>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            {gpsError.type !== 'permission_denied' && (
              <button
                onClick={handleRetryLocation}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* DURATION SELECTOR — shown after successful GPS */}
      {flowState === 'selecting_duration' && gpsPosition && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 pr-2">
              <span className="text-xs font-semibold text-blue-500 tracking-wider uppercase">New Parking Session</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                {gpsAddress ? gpsAddress : 'Location confirmed'}
              </h3>
              {/* Display the real GPS coordinates */}
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-[10px]">📍</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {formatCoord(gpsPosition.latitude)}, {formatCoord(gpsPosition.longitude)}
                </p>
              </div>
              {gpsPosition.accuracy && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  ±{Math.round(gpsPosition.accuracy)}m accuracy
                </p>
              )}
            </div>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">
            Expected duration? <span className="text-slate-400">(Optional)</span>
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {durations.map((dur) => (
              <button
                key={dur}
                onClick={() => setSelectedDuration(dur)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                  selectedDuration === dur
                    ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {dur}
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirmStart}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
          >
            Confirm Parking
          </button>
        </div>
      )}

      {/* CONFIRM LEAVING PANEL */}
      {flowState === 'confirm_leaving' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 border border-slate-100 dark:border-slate-800 text-center">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Leaving your parking spot?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            This will complete your active session and reward you with points.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setFlowState('idle')}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmLeaving}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all duration-200"
            >
              I'm Leaving
            </button>
          </div>
        </div>
      )}

      {/* IDLE: Active session card OR "I'm Parked" button */}
      {flowState === 'idle' && earnedPointsNotification === null && (
        <>
          {activeSession ? (
            <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-5 border border-slate-800">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active Session</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white mt-1 truncate max-w-[200px]">You're parked</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center truncate max-w-[220px]">
                    <span className="mr-1">📍</span>
                    {activeSession.locationName}
                  </p>
                  {/* Show real stored GPS coordinates */}
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {formatCoord(activeSession.latitude)}, {formatCoord(activeSession.longitude)}
                  </p>
                </div>
                {activeSession.estimatedDuration && (
                  <div className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                    Est: {activeSession.estimatedDuration}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Elapsed Time</p>
                  <p className="text-2xl font-black text-white mt-0.5 tracking-tight font-mono">{elapsedTime}</p>
                </div>
                <button
                  onClick={handleImLeavingClick}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/25 transition-all duration-200 text-sm"
                >
                  I'm Leaving
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartParkingClick}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 text-base"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>I'm Parked</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
