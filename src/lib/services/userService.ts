import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';

export function subscribeToUserDoc(uid: string, callback: (user: User | null) => void) {
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        id: docSnap.id,
        points: data.points || 0,
        username: data.username,
        usernameNormalized: data.usernameNormalized,
        profileImageUrl: data.profileImageUrl,
        privacyMode: data.privacyMode || 'public',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    } else {
      callback(null);
    }
  });
}

export async function createUserDoc(uid: string) {
  const userDocRef = doc(db, 'users', uid);
  // Only create if it doesn't already exist
  const docSnap = await getDoc(userDocRef);
  if (!docSnap.exists()) {
    await setDoc(userDocRef, {
      points: 0,
      privacyMode: 'public', // sensible default
      createdAt: serverTimestamp(),
    });
  }
}

export async function checkUsernameAvailability(username: string, currentUid?: string): Promise<boolean> {
  const usernameNormalized = username.trim().toLowerCase();
  if (!usernameNormalized) return false;
  
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('usernameNormalized', '==', usernameNormalized));
  
  try {
    const querySnapshot = await getDocs(q);
    
    // Available if no one has it, OR if the only person who has it is the current user
    if (querySnapshot.empty) return true;
    if (currentUid && querySnapshot.docs.length === 1 && querySnapshot.docs[0].id === currentUid) return true;
    
    return false;
  } catch (error) {
    console.error(`[DEBUG] checkUsernameAvailability THREW AN ERROR:`, error);
    throw error;
  }
}

export async function updateUsername(uid: string, username: string): Promise<boolean> {
  console.log(`[DEBUG] updateUsername called with UID: ${uid}, Alias: "${username}"`);
  const isAvailable = await checkUsernameAvailability(username, uid);
  console.log(`[DEBUG] checkUsernameAvailability returned: ${isAvailable}`);
  if (!isAvailable) return false;

  const userDocRef = doc(db, 'users', uid);
  console.log(`[DEBUG] Document path: users/${uid}`);
  
  try {
    // Ensure document exists
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      await createUserDoc(uid);
    }

    await updateDoc(userDocRef, {
      username: username.trim(),
      usernameNormalized: username.trim().toLowerCase(),
    });
    console.log(`[DEBUG] updateDoc succeeded for alias: "${username}"`);
    return true;
  } catch (error) {
    console.error(`[DEBUG] updateDoc THREW AN ERROR:`, error);
    return false;
  }
}

export async function updatePrivacyMode(uid: string, privacyMode: 'public' | 'anonymous' | 'hidden') {
  const userDocRef = doc(db, 'users', uid);
  // Ensure document exists
  const docSnap = await getDoc(userDocRef);
  if (!docSnap.exists()) {
    await createUserDoc(uid);
  }

  await updateDoc(userDocRef, {
    privacyMode
  });
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const userDocRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      points: data.points || 0,
      username: data.username,
      usernameNormalized: data.usernameNormalized,
      profileImageUrl: data.profileImageUrl,
      privacyMode: data.privacyMode || 'public',
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }
  return null;
}
