'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

interface LocationPickerProps {
  initialLatitude: number;
  initialLongitude: number;
  addressLabel?: string;
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  onCancel?: () => void;
  confirmButtonText?: string;
}

export default function LocationPicker({
  initialLatitude,
  initialLongitude,
  addressLabel,
  onConfirm,
  onCancel,
  confirmButtonText = 'Confirm Exact Pin Position',
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const markerRef = useRef<maptilersdk.Marker | null>(null);

  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: initialLatitude,
    longitude: initialLongitude,
  });
  const [initError, setInitError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!apiKey) {
      setInitError('MapTiler API Key is missing. Please add NEXT_PUBLIC_MAPTILER_KEY to .env.local');
      return;
    }

    // Validate coordinates
    const validLat = typeof initialLatitude === 'number' && !isNaN(initialLatitude) && initialLatitude >= -90 && initialLatitude <= 90;
    const validLng = typeof initialLongitude === 'number' && !isNaN(initialLongitude) && initialLongitude >= -180 && initialLongitude <= 180;

    const startLat = validLat ? initialLatitude : -33.9333;
    const startLng = validLng ? initialLongitude : 18.8579;

    setCoords({ latitude: startLat, longitude: startLng });

    try {
      maptilersdk.config.apiKey = apiKey;

      const mapInstance = new maptilersdk.Map({
        container: mapContainerRef.current,
        style: maptilersdk.MapStyle.STREETS,
        center: [startLng, startLat],
        zoom: 16,
        navigationControl: false,
        geolocateControl: false,
      });

      // Add zoom control buttons (top right)
      mapInstance.addControl(new maptilersdk.NavigationControl(), 'top-right');

      // Custom Pin Element for Spot Business
      const pinEl = document.createElement('div');
      pinEl.className = 'cursor-grab active:cursor-grabbing transition-transform';
      pinEl.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            background: #FF5A36;
            color: white;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border: 2px solid #171717;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
            white-space: nowrap;
            margin-bottom: 2px;
          ">
            Drag to pin
          </div>
          <div style="
            width: 36px;
            height: 36px;
            background: #FF5A36;
            border: 2.5px solid #171717;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          ">
            <span style="transform: rotate(45deg); font-size: 16px; color: white;">📍</span>
          </div>
          <div style="
            width: 10px;
            height: 4px;
            background: rgba(0,0,0,0.3);
            border-radius: 50%;
            margin-top: 2px;
          "></div>
        </div>
      `;

      const marker = new maptilersdk.Marker({
        element: pinEl,
        draggable: true,
        anchor: 'bottom',
      })
        .setLngLat([startLng, startLat])
        .addTo(mapInstance);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setCoords({
          latitude: lngLat.lat,
          longitude: lngLat.lng,
        });
      });

      // Also allow clicking anywhere on the map to relocate pin
      mapInstance.on('click', (e) => {
        marker.setLngLat(e.lngLat);
        setCoords({
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng,
        });
      });

      markerRef.current = marker;
      mapRef.current = mapInstance;

      return () => {
        marker.remove();
        mapInstance.remove();
        markerRef.current = null;
        mapRef.current = null;
      };
    } catch (err: any) {
      console.error('Failed to initialize location picker map:', err);
      setInitError('Failed to initialize map.');
    }
  }, [apiKey, initialLatitude, initialLongitude]);

  return (
    <div className="flex flex-col space-y-3 bg-spot-cream/50 p-3 rounded-2xl border-2 border-spot-ink">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-spot-ink flex items-center gap-1.5">
            <span>📍</span> Precise Pin Placement
          </span>
          <p className="text-[11px] text-spot-muted font-bold">
            Drag the pin or tap the map to place your storefront accurately.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-spot-muted hover:text-spot-ink px-2 py-1 rounded transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {addressLabel && (
        <div className="text-xs font-semibold text-spot-ink/80 truncate bg-white/70 px-2.5 py-1.5 rounded-lg border border-spot-ink/10">
          <span className="font-bold text-spot-ink">Address: </span>
          {addressLabel}
        </div>
      )}

      {initError ? (
        <div className="p-4 bg-spot-red/10 border-2 border-spot-red/30 rounded-xl text-xs font-bold text-spot-red">
          ⚠️ {initError}
        </div>
      ) : (
        <div className="relative w-full h-56 rounded-xl overflow-hidden border-2 border-spot-ink shadow-inner">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      )}

      {/* Lat / Lng coordinates display */}
      <div className="flex items-center justify-between text-[11px] font-mono text-spot-muted bg-white/80 px-3 py-1.5 rounded-xl border border-spot-ink/10">
        <div>
          <span className="font-bold text-spot-ink">Lat:</span> {coords.latitude.toFixed(6)}
        </div>
        <div>
          <span className="font-bold text-spot-ink">Lng:</span> {coords.longitude.toFixed(6)}
        </div>
      </div>

      {/* Confirmation Action */}
      <button
        type="button"
        onClick={() => onConfirm(coords)}
        className="w-full py-2.5 bg-spot-green hover:bg-spot-green/90 text-spot-ink font-black rounded-xl border-2 border-spot-ink shadow-[0_2px_0_0_#171717] active:shadow-none active:translate-y-0.5 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
      >
        <span>✓</span> {confirmButtonText}
      </button>
    </div>
  );
}
