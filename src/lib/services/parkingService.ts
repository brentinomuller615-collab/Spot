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

export function subscribeToGlobalActiveSessions(currentUid: string | undefined, callback: (sessions: ParkingSession[]) => void) {
  console.log(`[DIAGNOSTIC] subscribeToGlobalActiveSessions initialized with currentUid:`, currentUid);

  // Query all active sessions globally
  const q = query(
    collection(db, 'parkingSessions'),
    where('status', 'in', ['active', 'just_left'])
  );

  return onSnapshot(q, (querySnapshot) => {
    console.log(`[DIAGNOSTIC] Firestore onSnapshot triggered. Total docs returned:`, querySnapshot.docs.length);
    const sessions: ParkingSession[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      console.log(`[DIAGNOSTIC] Received doc: ID=${docSnap.id}, userId=${data.userId}, status=${data.status}, lat=${data.latitude}, lng=${data.longitude}`);
      
      // Filter out the current user's own session on the client side
      // since Firestore doesn't support logical OR/NOT easily in rules/queries here
      if (data.userId !== currentUid) {
        
        // Filter out expired just_left sessions to guarantee they disappear on reload
        // even if the driver's app closed before their setTimeout completed.
        if (data.status === 'just_left' && data.endedAt) {
          const endedAtTime = data.endedAt.toDate?.()?.getTime() || 0;
          if (Date.now() - endedAtTime > 5 * 60 * 1000) {
            return; // Skip stale just_left session
          }
        }

        sessions.push({
          id: docSnap.id,
          userId: data.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          locationName: data.locationName,
          startedAt: data.startedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          estimatedDuration: data.estimatedDuration,
          status: data.status,
          pointsAwarded: data.pointsAwarded || 0,
          municipalParkingId: data.municipalParkingId,
        });
      } else {
        console.log(`[DIAGNOSTIC] Filtered out session ID=${docSnap.id} because userId (${data.userId}) === currentUid (${currentUid})`);
      }
    });
    
    console.log(`[DIAGNOSTIC] Calling MapView callback with ${sessions.length} sessions.`);
    callback(sessions);
  }, (error) => {
    console.error('[MULTIPLAYER FIRESTORE ERROR]', error);
  });
}

export function subscribeToParkingHistory(uid: string, callback: (history: ParkingSession[]) => void) {
  const q = query(
    collection(db, 'parkingSessions'),
    where('userId', '==', uid),
    where('status', 'in', ['completed', 'just_left'])
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
    status: 'just_left',
    endedAt: serverTimestamp(),
    pointsAwarded: 15, // 10 for parking + 5 for leaving
  });

  // Hook into Spot Points economy: Award leaving report points
  await awardLeavingReport(userId, sessionId).catch(console.error);

  // Transition to completed after 5 minutes to remove the opportunity
  setTimeout(() => {
    updateDoc(sessionDocRef, { status: 'completed' }).catch(console.error);
  }, 5 * 60 * 1000);
}
