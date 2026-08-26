import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';

export function signUpWithEmailAndPassword(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signInWithEmailAndPassword(email: string, password: string) {
  return fbSignInWithEmailAndPassword(auth, email, password);
}

export function signOutUser() {
  return fbSignOut(auth);
}

export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
