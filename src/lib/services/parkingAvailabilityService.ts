import { collection, addDoc, query, where, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface ParkingAvailabilityObservation {
  id: string;
  parkingAreaId: string;
  availableBays: '1' | '2' | '3' | '4' | '5+';
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

export async function reportParkingAvailability(
  parkingAreaId: string,
  availableBays: '1' | '2' | '3' | '4' | '5+',
  uid: string
): Promise<string> {
  const colRef = collection(db, 'parkingAvailability');

  // Set expiresAt to ~10 minutes from now
  const now = new Date();
  const expiresAtDate = new Date(now.getTime() + 10 * 60 * 1000);

  const observation = {
    parkingAreaId,
    availableBays,
    createdBy: uid,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAtDate),
    status: 'active'
  };

  const docRef = await addDoc(colRef, observation);
  return docRef.id;
}

export function subscribeToParkingAvailability(
  callback: (observations: ParkingAvailabilityObservation[]) => void
) {
  const colRef = collection(db, 'parkingAvailability');
  
  // We subscribe to active ones. Client will filter by expiresAt vs Date.now()
  const q = query(colRef, where('status', '==', 'active'));

  return onSnapshot(q, (snapshot) => {
    const observations: ParkingAvailabilityObservation[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      observations.push({
        id: docSnap.id,
        parkingAreaId: data.parkingAreaId,
        availableBays: data.availableBays,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        status: data.status
      });
    });
    callback(observations);
  });
}
