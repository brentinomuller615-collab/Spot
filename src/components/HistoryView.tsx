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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto pb-28">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Parking History</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Your previous parking contributions</p>
        </div>
        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
          {history.length} sessions
        </span>
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-full flex items-center justify-center text-2xl mb-4">
            🚗
          </div>
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No sessions yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
            Your completed parking sessions will appear here. Start your first session on the Map screen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => (
            <div 
              key={session.id} 
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-3">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{session.locationName}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(session.startedAt)}</p>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  +{session.pointsAwarded} pts
                </span>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 dark:border-slate-850 text-xs">
                <div className="flex space-x-4 text-slate-500 dark:text-slate-400 font-medium">
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block">Start</span>
                    <span className="font-semibold">{formatTime(session.startedAt)}</span>
                  </div>
                  {session.endedAt && (
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block">End</span>
                      <span className="font-semibold">{formatTime(session.endedAt)}</span>
                    </div>
                  )}
                </div>

                {session.estimatedDuration && (
                  <div className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
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
