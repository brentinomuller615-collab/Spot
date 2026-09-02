'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import { useParkingSession } from '../hooks/useParkingSession';
import { fetchMunicipalParking } from '../lib/services/municipalParkingService';
import type { MunicipalParkingLocation } from '../lib/municipalParking';
import { getLiveParkingActivity, LiveParkingActivity } from '../lib/services/liveActivityService';
import { getHistoricalParkingActivity, HistoricalParkingPattern } from '../lib/services/historicalActivityService';
import { getParkingLikelihood, ParkingLikelihoodResult } from '../lib/services/parkingLikelihoodService';
import { calculateDistanceMeters } from '../lib/utils/geo';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import DealsButton from './DealsButton';
import HandoffModal, { HandoffOpportunity } from './HandoffModal';
import { getPublicSpotterIdentity } from '../lib/services/ratingService';

interface MapViewProps {
  onOpenDeals?: () => void;
}

export default function MapView({ onOpenDeals }: MapViewProps) {
  const { currentLocation, selectedDestination, activeSession, refreshLocation } = useParkingSession();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const [map, setMap] = useState<maptilersdk.Map | null>(null);
  const userMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const destMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const activeSessionMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const hasCenteredOnUserRef = useRef(false);
  /** Refs for municipal parking markers — one per location, keyed by OBJECTID. */
  const municipalMarkersRef = useRef<Map<number, maptilersdk.Marker>>(new Map());

  const [initError, setInitError] = useState<string | null>(null);
  const [municipalError, setMunicipalError] = useState<string | null>(null);
  const [municipalLocations, setMunicipalLocations] = useState<MunicipalParkingLocation[]>([]);
  const [liveActivity, setLiveActivity] = useState<LiveParkingActivity | null>(null);
  const [liveActivityLoading, setLiveActivityLoading] = useState<boolean>(false);
  const [historicalActivity, setHistoricalActivity] = useState<HistoricalParkingPattern | null>(null);
  const [historicalActivityLoading, setHistoricalActivityLoading] = useState<boolean>(false);

  // Handoff functionality
  const [mockOpportunities, setMockOpportunities] = useState<HandoffOpportunity[]>([]);
  const mockMarkersRef = useRef<maptilersdk.Marker[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<HandoffOpportunity | null>(null);



  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!apiKey) {
      setInitError('MapTiler API Key is missing. Please add NEXT_PUBLIC_MAPTILER_KEY to .env.local');
      return;
    }

    try {
      maptilersdk.config.apiKey = apiKey;

      // Determine initial center on mount
      // Do NOT put currentLocation or selectedDestination in dependency array to avoid destroying the map on every change.
      const initialCenter: [number, number] = selectedDestination
        ? [selectedDestination.longitude, selectedDestination.latitude]
        : (currentLocation ? [currentLocation.longitude, currentLocation.latitude] : [18.8579, -33.9333]);

      const mapInstance = new maptilersdk.Map({
        container: mapContainerRef.current,
        style: maptilersdk.MapStyle.STREETS.DARK,
        center: initialCenter,
        zoom: 15,
        navigationControl: false, // We will provide our own floating controls/recenter button
        geolocateControl: false,
      });

      mapRef.current = mapInstance;
      setMap(mapInstance);

      return () => {
        mapInstance.remove();
        mapRef.current = null;
        setMap(null);
      };
    } catch (err: any) {
      console.error('MapTiler initialization error:', err);
      setInitError('Failed to initialize the interactive map.');
    }
  }, [apiKey]);

  // Generate Mock Leaving Spots once map is ready and location is found
  useEffect(() => {
    if (!map || !currentLocation || mockOpportunities.length > 0) return;
    
    // Generate 2 mock spots nearby
    const mock1: HandoffOpportunity = {
      id: 'mock-handoff-1',
      latitude: currentLocation.latitude + 0.001,
      longitude: currentLocation.longitude + 0.001,
      leavingIn: '2:14',
      mockRatingAverage: 4.8,
      mockAccuracyPercentage: 96,
      spotter: {
        id: 'mock-user-1',
        points: 50,
        username: 'FastParker',
        usernameNormalized: 'fastparker',
        privacyMode: 'public',
        createdAt: new Date().toISOString()
      }
    };

    const mock2: HandoffOpportunity = {
      id: 'mock-handoff-2',
      latitude: currentLocation.latitude - 0.001,
      longitude: currentLocation.longitude + 0.0015,
      leavingIn: '0:45',
      mockRatingAverage: 4.2,
      mockAccuracyPercentage: 80,
      spotter: {
        id: 'mock-user-2',
        points: 120,
        username: 'NinjaParker',
        privacyMode: 'anonymous',
        createdAt: new Date().toISOString()
      }
    };
    
    setMockOpportunities([mock1, mock2]);
  }, [map, currentLocation, mockOpportunities.length]);

  // Render Mock Spots
  useEffect(() => {
    if (!map) return;
    
    // Clear old
    mockMarkersRef.current.forEach(m => m.remove());
    mockMarkersRef.current = [];

    mockOpportunities.forEach(opp => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-110 transition-transform';
      el.style.zIndex = '4';
      
      const identity = getPublicSpotterIdentity(
        opp.spotter,
        opp.mockRatingAverage || 0,
        opp.mockAccuracyPercentage || 0
      );
      const isHidden = !identity;
      const displayInitial = isHidden ? '?' : (identity.displayName.charAt(0).toUpperCase() || 'S');

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -bottom-1 w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
          <div class="bg-slate-900 border-2 border-amber-500 rounded-full w-8 h-8 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/20">
            <span class="text-xs font-bold">${displayInitial}</span>
          </div>
          <div class="absolute -top-6 whitespace-nowrap bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            ${opp.leavingIn}
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedOpportunity(opp);
      });

      const marker = new maptilersdk.Marker({ element: el })
        .setLngLat([opp.longitude, opp.latitude])
        .addTo(map);
      
      mockMarkersRef.current.push(marker);
    });
  }, [map, mockOpportunities]);

  // Update User Current Location Marker
  useEffect(() => {
    if (!map) return;

    if (!currentLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const { latitude, longitude } = currentLocation;

    // Create user location marker elements
    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center w-8 h-8';
      el.style.zIndex = '10'; // Keep current location on top
      el.innerHTML = `
        <span class="absolute w-8 h-8 rounded-full bg-blue-500/20 animate-ping"></span>
        <span class="relative w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md"></span>
      `;
      userMarkerRef.current = new maptilersdk.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([longitude, latitude]);
    }

    // Center map on user location the first time it becomes available
    if (!hasCenteredOnUserRef.current) {
      hasCenteredOnUserRef.current = true;
      map.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        essential: true,
      });
    }
  }, [map, currentLocation]);

  // Update Selected Destination Marker
  useEffect(() => {
    if (!map) return;

    if (selectedDestination) {
      const { longitude, latitude } = selectedDestination;

      if (!destMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center cursor-pointer';
        el.style.zIndex = '5';
        el.innerHTML = `
          <div class="animate-bounce" style="animation-duration: 2s">
            <span class="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-red-500/20"></span>
            <svg class="w-8 h-8 text-red-500 filter drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
        `;
        destMarkerRef.current = new maptilersdk.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map);
      } else {
        destMarkerRef.current.setLngLat([longitude, latitude]);
      }

      // Fly to destination
      map.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        essential: true,
      });
    } else {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
    }
  }, [map, selectedDestination]);

  // Update Active Parking Session Marker
  useEffect(() => {
    if (!map) return;

    if (activeSession) {
      const { longitude, latitude, locationName } = activeSession;

      if (!activeSessionMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center cursor-pointer';
        el.style.zIndex = '2';
        el.innerHTML = `
          <div class="bg-emerald-600 border-2 border-white rounded-full p-2 shadow-lg flex items-center justify-center text-white">
            <span class="text-sm">🚗</span>
          </div>
        `;
        
        activeSessionMarkerRef.current = new maptilersdk.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .setPopup(new maptilersdk.Popup({ offset: 25 }).setHTML(`<div class="p-1 text-xs font-bold text-slate-800">${locationName}</div>`))
          .addTo(map);
      } else {
        activeSessionMarkerRef.current.setLngLat([longitude, latitude]);
      }
    } else {
      if (activeSessionMarkerRef.current) {
        activeSessionMarkerRef.current.remove();
        activeSessionMarkerRef.current = null;
      }
    }
  }, [map, activeSession]);

  // Fetch and render municipal parking infrastructure markers
  // Runs once when the map instance becomes available.
  // Data is fetched from our own /api/municipal-parking route (which caches the municipality's data).
  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    const loadMunicipalParking = async () => {
      setMunicipalError(null);
      const locations = await fetchMunicipalParking();

      if (cancelled) return;

      if (locations.length === 0) {
        // Service may be temporarily down — not an error worth surfacing to the user.
        return;
      }

      for (const loc of locations as MunicipalParkingLocation[]) {
        // Skip if already rendered (safety guard against double-call in StrictMode)
        if (municipalMarkersRef.current.has(loc.id)) continue;

        const el = document.createElement('div');
        el.className = 'flex items-center justify-center cursor-pointer';
        el.style.zIndex = '1'; // Below all other marker types
        el.title = loc.categoryLabel;
        el.innerHTML = `
          <div style="
            width: 22px;
            height: 22px;
            background: rgba(99, 102, 241, 0.85);
            border: 1.5px solid rgba(255,255,255,0.7);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 4px rgba(0,0,0,0.4);
            font-size: 11px;
            color: white;
            font-weight: bold;
            letter-spacing: -0.5px;
            transition: transform 0.15s ease;
          " title="${loc.categoryLabel}">
            P
          </div>
        `;

        // Popup content — only verified fields from the municipal dataset
        const popupLines: string[] = [];
        popupLines.push(`<p style="font-weight:700;font-size:13px;margin:0 0 2px">${loc.categoryLabel}</p>`);
        if (loc.name && loc.name !== loc.categoryLabel) {
          popupLines.push(`<p style="font-size:11px;color:#475569;margin:0">${loc.name}</p>`);
        }
        if (loc.streetName) {
          popupLines.push(`<p style="font-size:11px;color:#64748b;margin:2px 0 0">${loc.streetName}</p>`);
        }
        if (loc.builtUpName) {
          popupLines.push(`<p style="font-size:11px;color:#64748b;margin:2px 0 0">${loc.builtUpName}</p>`);
        }
        popupLines.push(`<p style="font-size:9px;color:#94a3b8;margin:4px 0 0">Municipal infrastructure only</p>`);

        const popup = new maptilersdk.Popup({ offset: 12, closeButton: true })
          .setHTML(`<div style="padding:6px 8px;min-width:120px">${popupLines.join('')}</div>`);
          


        const marker = new maptilersdk.Marker({ element: el, anchor: 'center' })
          .setLngLat([loc.longitude, loc.latitude]) // MapTiler/MapLibre expects [lng, lat]
          .setPopup(popup)
          .addTo(map);

        municipalMarkersRef.current.set(loc.id, marker);
      }
      
      if (!cancelled) {
        setMunicipalLocations(locations as MunicipalParkingLocation[]);
      }
    };

    loadMunicipalParking().catch((err) => {
      if (!cancelled) {
        console.warn('[MapView] Municipal parking load error:', err);
        setMunicipalError('Municipal parking data temporarily unavailable');
      }
    });

    return () => {
      cancelled = true;
      // Clean up all municipal markers when map is destroyed
      municipalMarkersRef.current.forEach((m) => m.remove());
      municipalMarkersRef.current.clear();
    };
  }, [map]); // Only re-run when map instance changes — NOT on GPS/destination/session updates

  // Fetch live activity when selected destination changes
  useEffect(() => {
    let cancelled = false;

    if (selectedDestination) {
      setLiveActivityLoading(true);
      getLiveParkingActivity(selectedDestination.latitude, selectedDestination.longitude)
        .then(activity => {
          if (!cancelled) {
            setLiveActivity(activity);
            setLiveActivityLoading(false);
          }
        })
        .catch(err => {
          console.warn('[MapView] Live activity load error:', err);
          if (!cancelled) {
            setLiveActivityLoading(false);
          }
        });
    } else {
      setLiveActivity(null);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedDestination]);

  // Fetch historical activity when selected destination changes
  useEffect(() => {
    let cancelled = false;

    if (selectedDestination) {
      setHistoricalActivityLoading(true);
      const now = new Date();
      const dayOfWeek = now.getDay();
      const hour = now.getHours();
      
      getHistoricalParkingActivity(selectedDestination.latitude, selectedDestination.longitude, dayOfWeek, hour)
        .then(activity => {
          if (!cancelled) {
            setHistoricalActivity(activity);
            setHistoricalActivityLoading(false);
          }
        })
        .catch(err => {
          console.warn('[MapView] Historical activity load error:', err);
          if (!cancelled) {
            setHistoricalActivityLoading(false);
          }
        });
    } else {
      setHistoricalActivity(null);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedDestination]);

  // Score nearby municipal parking locations
  useEffect(() => {
    let cancelled = false;

    if (!selectedDestination || municipalLocations.length === 0) {
      return; // Skip if no destination
    }

    const fetchLikelihoods = async () =>
    {
      const nearbyLocs = municipalLocations.filter(loc => {
        return calculateDistanceMeters(selectedDestination.latitude, selectedDestination.longitude, loc.latitude, loc.longitude) <= 500;
      });

      for (const loc of nearbyLocs) {
        if (cancelled) break;
        
        try {
          const likelihood = await getParkingLikelihood(loc, selectedDestination.latitude, selectedDestination.longitude);
          if (cancelled) break;

          const marker = municipalMarkersRef.current.get(loc.id);
          if (marker) {
            const el = marker.getElement();
            const div = el.querySelector('div');
            
            // Apply colored ring based on likelihood
            let borderColor = 'rgba(255,255,255,0.7)';
            let borderWidth = '1.5px';
            
            if (likelihood.classification === 'Better chance') {
              borderColor = '#10b981'; // emerald-500
              borderWidth = '2.5px';
            } else if (likelihood.classification === 'Mixed') {
              borderColor = '#f59e0b'; // amber-500
              borderWidth = '2.5px';
            } else if (likelihood.classification === 'Lower chance') {
              borderColor = '#ef4444'; // red-500
              borderWidth = '2.5px';
            }

            if (div) {
              div.style.borderColor = borderColor;
              div.style.borderWidth = borderWidth;
            }

            // ── Build the redesigned popup card ──────────────────────────
            // Hierarchy: status → location name → explanation → live → historical → evidence

            // 1. Status badge config
            let statusEmoji = '⚪';
            let statusLabel = 'NOT ENOUGH DATA';
            let statusBg = '#f1f5f9';
            let statusColor = '#64748b';
            let statusBorderColor = '#cbd5e1';
            let headerBg = '#f8fafc';

            if (likelihood.classification === 'Better chance') {
              statusEmoji = '🟢'; statusLabel = 'BETTER CHANCE';
              statusBg = '#ecfdf5'; statusColor = '#047857';
              statusBorderColor = '#6ee7b7'; headerBg = '#f0fdf4';
            } else if (likelihood.classification === 'Mixed') {
              statusEmoji = '🟠'; statusLabel = 'MIXED';
              statusBg = '#fffbeb'; statusColor = '#b45309';
              statusBorderColor = '#fcd34d'; headerBg = '#fefce8';
            } else if (likelihood.classification === 'Lower chance') {
              statusEmoji = '🔴'; statusLabel = 'LOWER CHANCE';
              statusBg = '#fff1f2'; statusColor = '#be123c';
              statusBorderColor = '#fca5a5'; headerBg = '#fff1f2';
            }

            // 2. Location name: prefer specific name over generic category label
            const locationName = (loc.name && loc.name !== loc.categoryLabel)
              ? loc.name
              : loc.categoryLabel;

            // 3. Explanation
            const explanation = likelihood.classification === 'unknown'
              ? "Spot hasn't observed enough parking activity here yet."
              : likelihood.reason;

            // 4. Live activity section
            const hasLive = likelihood.liveData !== null;
            const liveArrivals = likelihood.liveData?.recentArrivals ?? 0;
            const liveDepartures = likelihood.liveData?.recentDepartures ?? 0;
            const liveHasActivity = hasLive && (liveArrivals > 0 || liveDepartures > 0 || (likelihood.liveData?.nearbyActiveSessions ?? 0) > 0);
            let liveSection: string;
            if (liveHasActivity) {
              liveSection = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
                  <div>
                    <div style="font-size:18px;font-weight:700;color:#1e293b;line-height:1">${liveDepartures}</div>
                    <div style="font-size:10px;color:#64748b;margin-top:1px">↓ departures</div>
                  </div>
                  <div>
                    <div style="font-size:18px;font-weight:700;color:#1e293b;line-height:1">${liveArrivals}</div>
                    <div style="font-size:10px;color:#64748b;margin-top:1px">↑ arrivals</div>
                  </div>
                </div>`;
            } else {
              liveSection = `<p style="font-size:11px;color:#94a3b8;margin:0">No recent Spot activity nearby</p>`;
            }

            // 5. Historical section
            const histObs = likelihood.historicalData?.observationCount ?? 0;
            const histDuration = likelihood.historicalData?.averageParkingDuration;
            const histTurnover = likelihood.historicalData?.turnoverRate;
            const lastObservedAt = likelihood.historicalData?.lastObservedAt;
            
            // Format the bucket time label
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const bucketDayStr = likelihood.historicalData ? days[likelihood.historicalData.dayOfWeek] : '';
            const bucketHourStr = likelihood.historicalData ? likelihood.historicalData.hour.toString().padStart(2, '0') + ':00' : '';
            const bucketLabel = bucketDayStr ? `${bucketDayStr} · ${bucketHourStr}` : '';
            
            let historicalSection: string;
            if (histObs > 0) {
              const durationStr = histDuration ? `~${histDuration} min typical stay` : '';
              const turnoverStr = histTurnover !== null && histTurnover !== undefined ? `${histTurnover}% turnover` : '';
              
              let lastObservedStr = '';
              if (lastObservedAt) {
                const nowMs = new Date().getTime();
                const diffMs = Math.max(0, nowMs - lastObservedAt.getTime());
                const diffMinutes = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMinutes / 60);
                const diffDays = Math.floor(diffHours / 24);
                
                if (diffMinutes < 60) {
                  lastObservedStr = `${diffMinutes} min ago`;
                } else if (diffHours < 24) {
                  lastObservedStr = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
                } else {
                  lastObservedStr = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
                }
              }

              historicalSection = `
                ${bucketLabel ? `<p style="font-size:10px;font-weight:600;color:#64748b;margin:0 0 6px">${bucketLabel}</p>` : ''}
                <p style="font-size:13px;font-weight:700;color:#1e293b;margin:0;line-height:1">${histObs} observation${histObs === 1 ? '' : 's'}</p>
                ${turnoverStr ? `<p style="font-size:11px;color:#475569;margin:3px 0 0">${turnoverStr}</p>` : ''}
                ${durationStr ? `<p style="font-size:11px;color:#475569;margin:3px 0 0">${durationStr}</p>` : ''}
                ${lastObservedStr ? `<p style="font-size:10px;color:#94a3b8;margin:6px 0 0">Last observed: ${lastObservedStr}</p>` : ''}`;
            } else {
              historicalSection = `
                ${bucketLabel ? `<p style="font-size:10px;font-weight:600;color:#64748b;margin:0 0 6px">${bucketLabel}</p>` : ''}
                <p style="font-size:11px;color:#94a3b8;margin:0">Not enough historical data yet.</p>
                <p style="font-size:10px;color:#cbd5e1;margin:4px 0 0">Spot needs more observations for this time period.</p>
              `;
            }

            // 6. Evidence badge
            let evidenceLabel = 'Low';
            let evidenceBg = '#f1f5f9';
            let evidenceTextColor = '#64748b';
            if (likelihood.evidenceLevel === 'high') {
              evidenceLabel = 'High'; evidenceBg = '#ecfdf5'; evidenceTextColor = '#047857';
            } else if (likelihood.evidenceLevel === 'medium') {
              evidenceLabel = 'Medium'; evidenceBg = '#fffbeb'; evidenceTextColor = '#b45309';
            }

            const cardHTML = `
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:220px;max-width:280px;overflow:hidden;border-radius:2px">

                <!-- Status header -->
                <div style="background:${headerBg};border-bottom:1px solid ${statusBorderColor};padding:12px 14px 10px">
                  <div style="display:inline-flex;align-items:center;gap:6px;background:${statusBg};border:1px solid ${statusBorderColor};border-radius:20px;padding:4px 10px;margin-bottom:8px">
                    <span style="font-size:13px">${statusEmoji}</span>
                    <span style="font-size:11px;font-weight:800;letter-spacing:0.05em;color:${statusColor}">${statusLabel}</span>
                  </div>
                  <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 4px;line-height:1.3">${locationName}</p>
                  ${loc.streetName ? `<p style="font-size:11px;color:#64748b;margin:0">${loc.streetName}</p>` : ''}
                </div>

                <!-- Explanation -->
                <div style="padding:10px 14px;border-bottom:1px solid #f1f5f9">
                  <p style="font-size:12px;color:#334155;margin:0;line-height:1.5">${explanation}</p>
                </div>

                <!-- Live activity -->
                <div style="padding:10px 14px;border-bottom:1px solid #f1f5f9">
                  <p style="font-size:9px;font-weight:700;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase;margin:0 0 6px">Live Activity</p>
                  ${liveSection}
                </div>

                <!-- Historical -->
                <div style="padding:10px 14px;border-bottom:1px solid #f1f5f9">
                  <p style="font-size:9px;font-weight:700;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase;margin:0 0 6px">Historical</p>
                  ${historicalSection}
                </div>

                <!-- Evidence -->
                <div style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
                  <p style="font-size:9px;font-weight:700;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase;margin:0">Evidence</p>
                  <span style="font-size:10px;font-weight:700;background:${evidenceBg};color:${evidenceTextColor};padding:2px 8px;border-radius:10px">${evidenceLabel}</span>
                </div>

              </div>`;

            const popup = marker.getPopup();
            if (popup) {
              popup.setHTML(cardHTML);
            }
          }
        } catch (error) {
          console.warn('[MapView] Likelihood load error:', error);
        }
      }


    };

    fetchLikelihoods();

    return () => {
      cancelled = true;
    };
  }, [selectedDestination, municipalLocations]);

  const handleRecenter = async () => {
    if (!map) return;

    if (currentLocation) {
      map.flyTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        zoom: 16,
        essential: true,
      });
    } else {
      try {
        const pos = await refreshLocation();
        map.flyTo({
          center: [pos.longitude, pos.latitude],
          zoom: 16,
          essential: true,
        });
      } catch (err) {
        console.warn('Failed to get location on recenter:', err);
      }
    }
  };

  if (initError) {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-4 text-xl">
          ⚠️
        </div>
        <h3 className="text-sm font-bold text-slate-200">Map Loading Error</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[280px] leading-relaxed">{initError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Small Destination Label */}
      {selectedDestination && (
        <div className="absolute top-[72px] left-4 right-4 z-10 flex justify-center pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md shadow-sm rounded-full px-4 py-1.5 border border-slate-800 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <p className="text-[10px] font-bold text-slate-200 truncate max-w-[200px]">
              {selectedDestination.name}
            </p>
          </div>
        </div>
      )}




      {/* Floating Controls */}
      <div className="absolute top-32 right-4 z-10 flex flex-col space-y-4">
        {onOpenDeals && (
          <DealsButton onClick={onOpenDeals} />
        )}
        
        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className="p-3 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl shadow-lg transition-colors flex items-center justify-center"
          title="Recenter on My Location"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 0v4m0-4h4m-4 0H8m12 0a8 8 0 11-16 0 8 8 0 0116 0z" />
          </svg>
        </button>
      </div>

      {/* Municipal data error notice — non-blocking, subtle */}
      {municipalError && (
        <div className="absolute bottom-24 left-4 right-4 z-10 bg-slate-900/80 backdrop-blur-sm border border-amber-500/30 rounded-xl px-3 py-2 flex items-center space-x-2">
          <span className="text-amber-400 text-xs">⚠</span>
          <span className="text-xs text-slate-400">{municipalError}</span>
        </div>
      )}

      {/* Handoff Modal */}
      {selectedOpportunity && (
        <HandoffModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onClaim={() => {
            // Remove the claimed opportunity from the map
            setMockOpportunities(prev => prev.filter(o => o.id !== selectedOpportunity.id));
          }}
        />
      )}
    </div>
  );
}
