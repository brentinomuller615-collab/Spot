import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';

export function subscribeToUserDoc(uid: string, callback: (user: User | null) => void) {
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        id: docSnap.id,
        email: data.email || '',
        points: data.points || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    } else {
      callback(null);
    }
  });
}

export async function createUserDoc(uid: string, email: string) {
  const userDocRef = doc(db, 'users', uid);
  // Only create if it doesn't already exist
  const docSnap = await getDoc(userDocRef);
  if (!docSnap.exists()) {
    await setDoc(userDocRef, {
      email,
      points: 0,
      createdAt: serverTimestamp(),
    });
  }
}
