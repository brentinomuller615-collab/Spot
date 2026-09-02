import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ParkingSession } from '../types';
import { awardParkingContribution, awardLeavingReport } from './pointsService';

export function subscribeToActiveSession(uid: string, callback: (session: ParkingSession | null) => void) {
  const q = query(
    collection(db, 'parkingSessions'),
    where('userId', '==', uid),
    where('status', '==', 'active')
  );

  return onSnapshot(q, (querySnapshot) => {
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      callback({
        id: docSnap.id,
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName,
        startedAt: data.startedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        estimatedDuration: data.estimatedDuration,
        status: data.status,
        pointsAwarded: data.pointsAwarded || 0,
      });
    } else {
      callback(null);
    }
  });
}

export function subscribeToParkingHistory(uid: string, callback: (history: ParkingSession[]) => void) {
  const q = query(
    collection(db, 'parkingSessions'),
    where('userId', '==', uid),
    where('status', '==', 'completed')
  );

  return onSnapshot(q, (querySnapshot) => {
    const sessions: ParkingSession[] = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName,
        startedAt: data.startedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        endedAt: data.endedAt?.toDate?.()?.toISOString(),
        estimatedDuration: data.estimatedDuration,
        status: data.status,
        pointsAwarded: data.pointsAwarded || 0,
      };
    });

    // Sort in-memory to avoid mandatory composite index creation
    sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    callback(sessions);
  });
}

export async function startParkingSession(
  uid: string,
  locationName: string,
  latitude: number,
  longitude: number,
  duration?: string,
  municipalParkingId?: number
): Promise<ParkingSession> {
  const sessionsCol = collection(db, 'parkingSessions');

  // Client-side timestamp used for immediate UI display.
  // Firestore stores serverTimestamp() — onSnapshot will later reconcile.
  const clientStartedAt = new Date().toISOString();

  const sessionData: any = {
    userId: uid,
    locationName,
    latitude,
    longitude,
    estimatedDuration: duration || null,
    startedAt: serverTimestamp(),
    status: 'active',
    pointsAwarded: 0,
  };

  if (municipalParkingId !== undefined && municipalParkingId !== null) {
    sessionData.municipalParkingId = municipalParkingId;
  }

  const docRef = await addDoc(sessionsCol, sessionData);

  const result: ParkingSession = {
    id: docRef.id,
    userId: uid,
    locationName,
    latitude,
    longitude,
    startedAt: clientStartedAt,
    estimatedDuration: duration,
    status: 'active',
    pointsAwarded: 0,
  };

  if (municipalParkingId !== undefined && municipalParkingId !== null) {
    result.municipalParkingId = municipalParkingId;
  }

  // Hook into Spot Points economy: Award parking contribution points
  await awardParkingContribution(uid, docRef.id).catch(console.error);

  return result;
}


export async function completeParkingSession(userId: string, sessionId: string) {
  const sessionDocRef = doc(db, 'parkingSessions', sessionId);
  await updateDoc(sessionDocRef, {
    status: 'completed',
    endedAt: serverTimestamp(),
    pointsAwarded: 15, // 10 for parking + 5 for leaving
  });

  // Hook into Spot Points economy: Award leaving report points
  await awardLeavingReport(userId, sessionId).catch(console.error);
}
