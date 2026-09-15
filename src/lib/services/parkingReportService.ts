import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateDistanceMeters } from '../utils/geo';

export interface CrowdsourcedParking {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  createdBy: string;
  createdAt: string;
  source: string;
  status: string;
}

export async function reportParkingLocation(uid: string, latitude: number, longitude: number, accuracy?: number): Promise<CrowdsourcedParking> {
  const colRef = collection(db, 'crowdsourcedParking');
  
  // 1. Check for duplicates
  // Since we don't have geohashing set up in this MVP, we fetch active reports 
  // (In a real app, this would use geohashing or bounds queries)
  const q = query(colRef, where('status', '==', 'active'));
  const snapshot = await getDocs(q);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const distance = calculateDistanceMeters(latitude, longitude, data.latitude, data.longitude);
    if (distance <= 20) {
      // Duplicate found, just return it instead of creating a new one
      return {
        id: docSnap.id,
        latitude: data.latitude,
        longitude: data.longitude,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        source: data.source,
        status: data.status,
        accuracy: data.accuracy,
      };
    }
  }

  // 2. Create new report
  const newReport: any = {
    latitude,
    longitude,
    createdBy: uid,
    createdAt: serverTimestamp(),
    source: 'user_report',
    status: 'active'
  };
  
  if (typeof accuracy === 'number') {
    newReport.accuracy = accuracy;
  }
  
  const docRef = await addDoc(colRef, newReport);

  return {
    id: docRef.id,
    latitude,
    longitude,
    accuracy: accuracy || undefined,
    createdBy: uid,
    createdAt: new Date().toISOString(),
    source: 'user_report',
    status: 'active'
  };
}

export function subscribeToCrowdsourcedParking(callback: (locations: CrowdsourcedParking[]) => void) {
  const q = query(collection(db, 'crowdsourcedParking'), where('status', '==', 'active'));
  
  return onSnapshot(q, (snapshot) => {
    const locations: CrowdsourcedParking[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      locations.push({
        id: docSnap.id,
        latitude: data.latitude,
        longitude: data.longitude,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        source: data.source,
        status: data.status,
      });
    });
    callback(locations);
  });
}


