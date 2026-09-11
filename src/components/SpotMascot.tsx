'use client';

import React, { useState } from 'react';

export type MascotState = 
  | 'idle' 
  | 'searching' 
  | 'acquiring_location' 
  | 'location' 
  | 'parked' 
  | 'just_left' 
  | 'justleft'
  | 'excited' 
  | 'surprised' 
  | 'sleepy' 
  | 'confused';

const STATE_TO_FILE: Record<MascotState, string> = {
  idle: 'idle',
  searching: 'searching',
  acquiring_location: 'location',
  location: 'location',
  parked: 'parked',
  just_left: 'justleft',
  justleft: 'justleft',
  excited: 'excited',
  surprised: 'idle', // No 'surprised.webp' asset exists in public/mascot/
  sleepy: 'sleepy',
  confused: 'confused'
};

interface SpotMascotProps {
  state?: MascotState;
  size?: number;
  className?: string;
}

export default function SpotMascot({ 
  state = 'idle', 
  size = 64, 
  className = '' 
}: SpotMascotProps) {
  const [imageError, setImageError] = useState(false);
  
  // Resolve the state to the actual filename
  const resolvedFilename = STATE_TO_FILE[state] || 'idle';
  const activeFilename = imageError ? 'idle' : resolvedFilename;
  const src = `/mascot/${activeFilename}.webp`;

  return (
    <div 
      className={`relative inline-flex justify-center items-center ${className}`}
      style={{ 
        width: size, 
        height: size,
        animation: 'spotMascotFloat 3s ease-in-out infinite'
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes spotMascotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      
      {/* Ambient glow behind mascot */}
      <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/20 blur-xl rounded-full scale-[0.8] opacity-70" />
      
      <img
        src={src}
        alt=""
        className="w-full h-full object-contain relative z-10 drop-shadow-lg transition-transform duration-300"
        onError={() => {
          if (!imageError) {
            setImageError(true);
          }
        }}
      />
    </div>
  );
}
