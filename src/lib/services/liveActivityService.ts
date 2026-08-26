import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ParkingSession } from '../types';
import { ACTIVITY_RADIUS_METERS, calculateDistanceMeters } from '../utils/geo';

export const LIVE_ACTIVITY_WINDOW_MINUTES = 30;

export interface LiveParkingActivity {
  nearbyActiveSessions: number;
  recentArrivals: number;
  recentDepartures: number;
  uniqueUsers: number;
  lastActivityAt: Date | null;
}



/**
 * Gets live parking activity around a specific geographic point.
 */
export async function getLiveParkingActivity(
  targetLat: number,
  targetLon: number
): Promise<LiveParkingActivity> {
  const sessionsCol = collection(db, 'parkingSessions');
  const now = new Date();
  const timeWindowMs = LIVE_ACTIVITY_WINDOW_MINUTES * 60 * 1000;
  const timeWindowStart = new Date(now.getTime() - timeWindowMs);
  
  // We need to find:
  // 1. All currently active sessions.
  // 2. All completed sessions that ended within the last 30 minutes.
  
  // For the MVP, we query these two sets from Firestore and filter by distance client-side.
  const activeQuery = query(
    sessionsCol,
    where('status', '==', 'active')
  );
  
  const completedQuery = query(
    sessionsCol,
    where('status', '==', 'completed'),
    where('endedAt', '>=', Timestamp.fromDate(timeWindowStart))
  );

  try {
    const [activeSnap, completedSnap] = await Promise.all([
      getDocs(activeQuery),
      getDocs(completedQuery)
    ]);

    const activeDocs = activeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    const completedDocs = completedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    // Process Active Sessions
    const activeSessionsWithinRadius = activeDocs.filter(data => {
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return false;
      const distance = calculateDistanceMeters(targetLat, targetLon, data.latitude, data.longitude);
      return distance <= ACTIVITY_RADIUS_METERS;
    });

    // Process Completed Sessions
    const completedSessionsWithinRadius = completedDocs.filter(data => {
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return false;
      const distance = calculateDistanceMeters(targetLat, targetLon, data.latitude, data.longitude);
      return distance <= ACTIVITY_RADIUS_METERS;
    });

    let nearbyActiveSessions = 0;
    let recentArrivals = 0;
    let recentDepartures = 0;
    const uniqueUserIds = new Set<string>();
    let lastActivityAt: Date | null = null;
    
    // Function to update lastActivityAt
    const updateLastActivity = (date: Date) => {
      if (!lastActivityAt || date.getTime() > lastActivityAt.getTime()) {
        lastActivityAt = date;
      }
    };

    // Calculate metrics for active sessions
    activeSessionsWithinRadius.forEach(session => {
      nearbyActiveSessions++;
      if (session.userId) uniqueUserIds.add(session.userId);
      
      const startedAt = session.startedAt?.toDate ? session.startedAt.toDate() : new Date(session.startedAt);
      
      // If started within window, it's a recent arrival
      if (startedAt && startedAt.getTime() >= timeWindowStart.getTime()) {
        recentArrivals++;
        updateLastActivity(startedAt);
      }
    });

    // Calculate metrics for completed sessions
    completedSessionsWithinRadius.forEach(session => {
      if (session.userId) uniqueUserIds.add(session.userId);
      
      const startedAt = session.startedAt?.toDate ? session.startedAt.toDate() : new Date(session.startedAt);
      const endedAt = session.endedAt?.toDate ? session.endedAt.toDate() : new Date(session.endedAt);
      
      // If ended within window, it's a recent departure
      if (endedAt && endedAt.getTime() >= timeWindowStart.getTime()) {
        recentDepartures++;
        updateLastActivity(endedAt);
      }
      
      // If started within window, it's also a recent arrival
      if (startedAt && startedAt.getTime() >= timeWindowStart.getTime()) {
        recentArrivals++;
        updateLastActivity(startedAt);
      }
    });

    return {
      nearbyActiveSessions,
      recentArrivals,
      recentDepartures,
      uniqueUsers: uniqueUserIds.size,
      lastActivityAt
    };
  } catch (error) {
    console.error('Error fetching live parking activity:', error);
    // Return empty state on failure
    return {
      nearbyActiveSessions: 0,
      recentArrivals: 0,
      recentDepartures: 0,
      uniqueUsers: 0,
      lastActivityAt: null
    };
  }
}
