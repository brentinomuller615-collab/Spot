import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ACTIVITY_RADIUS_METERS, calculateDistanceMeters } from '../utils/geo';

export const HISTORICAL_WINDOW_DAYS = 90;

export interface HistoricalParkingPattern {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  hour: number;      // 0 to 23
  observationCount: number;
  arrivals: number;
  departures: number;
  averageParkingDuration: number | null; // in minutes (median)
  turnoverRate: number | null;
  lastObservedAt: Date | null;
  uniqueUsers: number;
}

/**
 * Helper to get day of week and hour in Africa/Johannesburg timezone
 */
export function getLocalDayAndHour(date: Date): { day: number, hour: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Johannesburg',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  
  let dayStr = '';
  let hourStr = '';
  for (const part of parts) {
    if (part.type === 'weekday') dayStr = part.value;
    if (part.type === 'hour') hourStr = part.value;
  }
  
  const days: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  };
  
  return {
    day: days[dayStr] ?? date.getDay(),
    hour: parseInt(hourStr, 10) || date.getHours()
  };
}

/**
 * Gets historical parking patterns for a specific geographic point and time bucket.
 * 
 * @param targetLat Latitude of the target location
 * @param targetLon Longitude of the target location
 * @param dayOfWeek 0 (Sunday) to 6 (Saturday)
 * @param hour 0 to 23
 */
export async function getHistoricalParkingActivity(
  targetLat: number,
  targetLon: number,
  dayOfWeek: number,
  hour: number
): Promise<HistoricalParkingPattern> {
  const sessionsCol = collection(db, 'parkingSessions');
  const now = new Date();
  const timeWindowMs = HISTORICAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const timeWindowStart = new Date(now.getTime() - timeWindowMs);
  
  // Query completed sessions within the last 90 days.
  const historicalQuery = query(
    sessionsCol,
    where('status', '==', 'completed'),
    where('startedAt', '>=', Timestamp.fromDate(timeWindowStart))
  );

  try {
    const historicalSnap = await getDocs(historicalQuery);
    const docs = historicalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    let observationCount = 0;
    let arrivals = 0;
    let departures = 0;
    const uniqueUserIds = new Set<string>();
    const durationsMinutes: number[] = [];
    let lastObservedAt: Date | null = null;

    docs.forEach(session => {
      if (typeof session.latitude !== 'number' || typeof session.longitude !== 'number') return;
      
      const distance = calculateDistanceMeters(targetLat, targetLon, session.latitude, session.longitude);
      if (distance > ACTIVITY_RADIUS_METERS) return;

      const startedAtDate = session.startedAt?.toDate ? session.startedAt.toDate() : (session.startedAt ? new Date(session.startedAt) : null);
      const endedAtDate = session.endedAt?.toDate ? session.endedAt.toDate() : (session.endedAt ? new Date(session.endedAt) : null);
      
      let matchedBucket = false;
      let sessionLastObserved: Date | null = null;
      
      // Check if arrival falls in the bucket
      if (startedAtDate) {
        const localStart = getLocalDayAndHour(startedAtDate);
        if (localStart.day === dayOfWeek && localStart.hour === hour) {
          arrivals++;
          matchedBucket = true;
          sessionLastObserved = startedAtDate;
        }
      }
      
      // Check if departure falls in the bucket
      if (endedAtDate) {
        const localEnd = getLocalDayAndHour(endedAtDate);
        if (localEnd.day === dayOfWeek && localEnd.hour === hour) {
          departures++;
          matchedBucket = true;
          if (!sessionLastObserved || endedAtDate > sessionLastObserved) {
            sessionLastObserved = endedAtDate;
          }
        }
      }
      
      if (matchedBucket) {
        observationCount++;
        if (session.userId) uniqueUserIds.add(session.userId);
        
        if (sessionLastObserved) {
          if (!lastObservedAt || sessionLastObserved > lastObservedAt) {
            lastObservedAt = sessionLastObserved;
          }
        }
        
        // Calculate duration if both exist and endedAt is after startedAt
        if (startedAtDate && endedAtDate && endedAtDate.getTime() >= startedAtDate.getTime()) {
          const durationMs = endedAtDate.getTime() - startedAtDate.getTime();
          durationsMinutes.push(Math.floor(durationMs / 60000));
        }
      }
    });

    let averageParkingDuration: number | null = null;
    if (durationsMinutes.length > 0) {
      durationsMinutes.sort((a, b) => a - b);
      const mid = Math.floor(durationsMinutes.length / 2);
      if (durationsMinutes.length % 2 === 0) {
        averageParkingDuration = Math.round((durationsMinutes[mid - 1] + durationsMinutes[mid]) / 2);
      } else {
        averageParkingDuration = durationsMinutes[mid];
      }
    }

    const turnoverRate = observationCount > 0 
      ? Math.round((departures / Math.max(1, arrivals)) * 100) 
      : null;

    return {
      dayOfWeek,
      hour,
      observationCount,
      arrivals,
      departures,
      averageParkingDuration,
      turnoverRate,
      lastObservedAt,
      uniqueUsers: uniqueUserIds.size
    };
  } catch (error) {
    console.error('Error fetching historical parking activity:', error);
    return {
      dayOfWeek,
      hour,
      observationCount: 0,
      arrivals: 0,
      departures: 0,
      averageParkingDuration: null,
      turnoverRate: null,
      lastObservedAt: null,
      uniqueUsers: 0
    };
  }
}
