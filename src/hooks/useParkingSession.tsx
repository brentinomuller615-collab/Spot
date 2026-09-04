'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ParkingSession, Destination } from '../lib/types';
import { subscribeToAuthChanges } from '../lib/services/authService';
import { subscribeToUserDoc } from '../lib/services/userService';
import { 
  subscribeToActiveSession, 
  subscribeToParkingHistory, 
  startParkingSession, 
  completeParkingSession 
} from '../lib/services/parkingService';
import { getCurrentPosition, GeolocationResult } from '../lib/services/geolocationService';

interface ParkingContextType {
  user: User | null;
  authEmail: string | null;
  authLoading: boolean;
  activeSession: ParkingSession | null;
  history: ParkingSession[];
  currentLocation: { latitude: number; longitude: number; name: string; accuracy?: number } | null;
  selectedDestination: Destination | null;
  searchDestination: (query: string) => Destination | null;
  selectDestination: (dest: Destination | null) => void;
  startParking: (locationName: string, latitude: number, longitude: number, duration?: string, municipalParkingId?: number) => Promise<void>;
  endParking: () => void;
  confirmEndParking: () => Promise<void>;
  dismissPointNotification: () => void;
  earnedPointsNotification: number | null;
  refreshLocation: () => Promise<GeolocationResult>;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ParkingSession | null>(null);
  const [history, setHistory] = useState<ParkingSession[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [earnedPointsNotification, setEarnedPointsNotification] = useState<number | null>(null);
  
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    name: string;
  } | null>(null);

  const refreshLocation = async (): Promise<GeolocationResult> => {
    const pos = await getCurrentPosition();
    setCurrentLocation({
      latitude: pos.latitude,
      longitude: pos.longitude,
      accuracy: pos.accuracy,
      name: 'Current Location',
    });
    return pos;
  };

  // Attempt to acquire location on load
  useEffect(() => {
    refreshLocation().catch(err => {
      console.warn('Initial location fetch failed or denied:', err);
    });
  }, []);

  // Subscribe to Auth State changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setActiveSession(null);
        setHistory([]);
        setAuthLoading(false);
      } else {
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Subscribe to User, Active Session, and History when logged in
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubUser = subscribeToUserDoc(firebaseUser.uid, (userData) => {
      if (userData) {
        setUser(userData);
      } else {
        setUser({
          id: firebaseUser.uid,
          points: 0,
          createdAt: new Date().toISOString(),
        });
      }
    });

    const unsubActive = subscribeToActiveSession(firebaseUser.uid, (session) => {
      setActiveSession(session);
    });

    const unsubHistory = subscribeToParkingHistory(firebaseUser.uid, (hist) => {
      setHistory(hist);
    });

    return () => {
      unsubUser();
      unsubActive();
      unsubHistory();
    };
  }, [firebaseUser]);

  const searchDestination = (query: string): Destination | null => {
    if (!query) return null;
    const { MOCK_DESTINATIONS } = require('../lib/mockData');
    const result = MOCK_DESTINATIONS.find((dest: Destination) =>
      dest.name.toLowerCase().includes(query.toLowerCase())
    );
    return result || null;
  };

  const selectDestination = (dest: Destination | null) => {
    setSelectedDestination(dest);
  };

  const startParking = async (
    locationName: string,
    latitude: number,
    longitude: number,
    duration?: string,
    municipalParkingId?: number
  ): Promise<void> => {
    if (!user) return;

    // Await the Firestore write. startParkingSession returns the created
    // ParkingSession immediately (with a client-side timestamp) so we can
    // update activeSession right away — no need to wait for onSnapshot.
    const newSession = await startParkingSession(
      user.id,
      locationName,
      latitude,
      longitude,
      duration === 'Skip' ? undefined : duration,
      municipalParkingId
    );

    // Immediately populate activeSession so the UI transitions without
    // waiting for the Firestore real-time listener to fire.
    setActiveSession(newSession);
  };

  const endParking = () => {
    // Just updates the active session to ready to end (visual flow handled in UI)
  };

  const confirmEndParking = async (): Promise<void> => {
    if (!activeSession) return;

    const pointsAwarded = 10;

    // Await the Firestore write directly — same pattern as startParking.
    // Do NOT rely on onSnapshot to clear activeSession; do it immediately
    // on success so the UI never shows a stale "I'm Leaving" button.
    if (!user) return;
    await completeParkingSession(user.id, activeSession.id);

    // Immediately clear local session and show points notification.
    // onSnapshot will eventually sync but we don't wait for it.
    setActiveSession(null);
    setEarnedPointsNotification(pointsAwarded);
  };

  const dismissPointNotification = () => {
    setEarnedPointsNotification(null);
  };

  return (
    <ParkingContext.Provider
      value={{
        user,
        authEmail: firebaseUser?.email || null,
        authLoading,
        activeSession,
        history,
        currentLocation,
        selectedDestination,
        searchDestination,
        selectDestination,
        startParking,
        endParking,
        confirmEndParking,
        dismissPointNotification,
        earnedPointsNotification,
        refreshLocation,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
}

export function useParkingSession() {
  const context = useContext(ParkingContext);
  if (context === undefined) {
    throw new Error('useParkingSession must be used within a ParkingProvider');
  }
  return context;
}

