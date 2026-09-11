import { collection, query, where, getDocs, setDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SpotPointsTransaction, PointTransactionType } from '../types';

export async function getSpotPointsTransactions(userId: string): Promise<SpotPointsTransaction[]> {
  const q = query(
    collection(db, 'spotPointsTransactions'),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const transactions: SpotPointsTransaction[] = querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      type: data.type as PointTransactionType,
      amount: data.amount,
      description: data.description,
      referenceId: data.referenceId,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });

  // Sort descending by date in memory to avoid needing composite indexes right away for V1
  transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return transactions;
}

export function subscribeToSpotPointsTransactions(userId: string, callback: (transactions: SpotPointsTransaction[]) => void) {
  const q = query(
    collection(db, 'spotPointsTransactions'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const transactions: SpotPointsTransaction[] = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        type: data.type as PointTransactionType,
        amount: data.amount,
        description: data.description,
        referenceId: data.referenceId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(transactions);
  });
}

export async function getSpotPointsBalance(userId: string): Promise<number> {
  const transactions = await getSpotPointsTransactions(userId);
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

// Helpers for securely creating transactions. 
// Note: setDoc is used so that if a duplicate transaction is attempted, it just safely overwrites the exact same data.

export async function awardParkingContribution(userId: string, sessionId: string) {
  const transactionId = `parking_contribution_${sessionId}`;
  const docRef = doc(db, 'spotPointsTransactions', transactionId);
  await setDoc(docRef, {
    userId,
    type: 'parking_contribution',
    amount: 10,
    description: 'Parking contribution',
    referenceId: sessionId,
    createdAt: Timestamp.now()
  });
}

export async function awardLeavingReport(userId: string, sessionId: string) {
  const transactionId = `leaving_report_${sessionId}`;
  const docRef = doc(db, 'spotPointsTransactions', transactionId);
  await setDoc(docRef, {
    userId,
    type: 'leaving_report',
    amount: 5,
    description: 'Leaving report',
    referenceId: sessionId,
    createdAt: Timestamp.now()
  });
}

export async function awardSuccessfulHandoff(spotterId: string, handoffId: string) {
  const transactionId = `successful_handoff_${handoffId}`;
  const docRef = doc(db, 'spotPointsTransactions', transactionId);
  await setDoc(docRef, {
    userId: spotterId,
    type: 'successful_handoff',
    amount: 25,
    description: 'Successful parking handoff',
    referenceId: handoffId,
    createdAt: Timestamp.now()
  });
}

export async function awardAccuracyBonus(spotterId: string, handoffId: string) {
  const transactionId = `accuracy_bonus_${handoffId}`;
  const docRef = doc(db, 'spotPointsTransactions', transactionId);
  await setDoc(docRef, {
    userId: spotterId,
    type: 'accuracy_bonus',
    amount: 5,
    description: 'Accuracy bonus',
    referenceId: handoffId,
    createdAt: Timestamp.now()
  });
}
