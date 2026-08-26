'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParkingSession } from '../hooks/useParkingSession';
import { Destination } from '../lib/types';
import { config as maptilerConfig, geocoding } from '@maptiler/client';

export default function SearchBar() {
  const { selectDestination, selectedDestination } = useParkingSession();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize MapTiler Client API Key
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (apiKey) {
      maptilerConfig.apiKey = apiKey;
    }
  }, []);

  // Sync with selected destination state (e.g. cleared elsewhere)
  useEffect(() => {
    if (selectedDestination) {
      setQuery(selectedDestination.name);
    } else {
      setQuery('');
    }
  }, [selectedDestination]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debouncing query state to avoid firing geocoding requests for every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Execute forward geocoding search when debounced query changes
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!apiKey || debouncedQuery.trim() === '') {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    let active = true;

    async function searchGeocoding() {
      try {
        const result = await geocoding.forward(debouncedQuery, {
          // Bias search towards Stellenbosch coordinates
          proximity: [18.8602, -33.9321],
          // Constrain search bounding box roughly around Western Cape for high relevance
          bbox: [18.0, -34.5, 19.5, -33.0],
          limit: 5,
          types: ['address', 'road', 'poi'],
        });

        if (active && result && result.features) {
          const newSuggestions: Destination[] = result.features.map((feature: any) => ({
            id: feature.id,
            name: feature.place_name,
            latitude: feature.center[1], // Latitude is second
            longitude: feature.center[0], // Longitude is first
            zones: [], // Demo parking zones are removed
          }));
          setSuggestions(newSuggestions);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Forward geocoding search failed:', err);
      }
    }

    searchGeocoding();

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim() === '') {
      setSuggestions([]);
      setIsOpen(false);
      selectDestination(null);
    }
  };

  const handleSelectSuggestion = (dest: Destination) => {
    selectDestination(dest);
    setQuery(dest.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    selectDestination(null);
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-4 right-4 z-20">
      <div className="relative flex items-center bg-slate-900/95 backdrop-blur-md shadow-lg rounded-2xl border border-slate-800 overflow-hidden">
        {/* Search icon */}
        <div className="pl-4 pr-2 text-slate-400 dark:text-slate-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        {/* Input field */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Where are you going?"
          className="w-full py-3.5 pr-10 text-sm font-medium text-slate-200 placeholder-slate-500 bg-transparent focus:outline-none"
        />

        {/* Clear icon */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((dest) => (
            <button
              key={dest.id}
              onClick={() => handleSelectSuggestion(dest)}
              className="w-full px-4 py-3 flex items-center space-x-3 text-left hover:bg-slate-800/50 transition-colors border-b border-slate-800 last:border-0"
            >
              <div className="p-2 rounded-lg bg-blue-950/50 text-blue-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200 truncate">{dest.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Search Result</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

