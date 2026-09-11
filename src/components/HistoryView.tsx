'use client';

import React from 'react';
import { useParkingSession } from '../hooks/useParkingSession';

export default function HistoryView() {
  const { history } = useParkingSession();

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="flex flex-col h-full bg-spot-cream p-6 overflow-y-auto pb-28">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-spot-ink tracking-tight">Parking History</h2>
          <p className="text-sm font-bold text-spot-muted mt-1">Your previous spots and stats</p>
        </div>
        <span className="px-3 py-1.5 bg-spot-orange text-white border-2 border-spot-ink rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_2px_0_0_#171717]">
          {history.length} sessions
        </span>
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 bg-spot-yellow text-spot-ink border-4 border-spot-ink rounded-full flex items-center justify-center text-3xl mb-5 transform -rotate-6 shadow-[0_4px_0_0_#171717]">
            🚗
          </div>
          <h3 className="text-xl font-black text-spot-ink tracking-tight">No parking adventures yet.</h3>
          <p className="text-sm text-spot-muted mt-2 max-w-[220px] font-bold leading-relaxed">
            Your completed parking sessions will appear here. Go claim a spot!
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {history.map((session) => (
            <div 
              key={session.id} 
              className="py-6 border-b-2 border-spot-ink/10 flex flex-col last:border-b-0 group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[10px] font-black text-spot-orange tracking-widest uppercase mb-1">
                    {formatDate(session.startedAt)}
                  </p>
                  <h4 className="text-lg font-black text-spot-ink truncate leading-tight">
                    {session.locationName}
                  </h4>
                </div>
                <div className="shrink-0">
                  <span className="text-sm font-black text-spot-green whitespace-nowrap bg-spot-cream border-2 border-spot-ink/10 px-3 py-1.5 rounded-xl shadow-[0_2px_0_0_#171717] transition-all group-hover:border-spot-green group-hover:shadow-[0_2px_0_0_#3FAE68] inline-block">
                    +{session.pointsAwarded} pts
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 text-xs">
                <div className="flex items-center space-x-3 text-spot-ink font-bold">
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-spot-red"></span>
                    <span>{formatTime(session.startedAt)}</span>
                  </div>
                  {session.endedAt && (
                    <>
                      <span className="text-spot-muted">→</span>
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-spot-muted"></span>
                        <span className="text-spot-muted">{formatTime(session.endedAt)}</span>
                      </div>
                    </>
                  )}
                </div>

                {session.estimatedDuration && (
                  <div className="text-[10px] bg-white border-2 border-spot-ink/10 text-spot-ink px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    Est: {session.estimatedDuration}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
