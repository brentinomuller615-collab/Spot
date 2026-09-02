import { collection, query, where, getDocs, setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';
import { awardSuccessfulHandoff, awardAccuracyBonus } from './pointsService';

export async function submitSpotterRating(
  ratingUserId: string,
  ratedUserId: string,
  handoffId: string,
  score: number,
  locationAccurate: boolean
): Promise<boolean> {
  // Prevent self-rating
  if (ratingUserId === ratedUserId) {
    console.error("Cannot rate yourself.");
    return false;
  }

  const ratingsCol = collection(db, 'spotterRatings');
  const ratingDocId = `${handoffId}_${ratingUserId}`;
  const ratingDocRef = doc(ratingsCol, ratingDocId);

  // Check for duplicate rating for this exact handoff (by checking if the doc exists)
  const snapshot = await getDoc(ratingDocRef);
  if (snapshot.exists()) {
    console.error("This handoff has already been rated by this user.");
    return false;
  }

  // Create the rating using the safe deterministic ID
  await setDoc(ratingDocRef, {
    ratedUserId,
    ratingUserId,
    handoffId,
    score,
    locationAccurate,
    createdAt: serverTimestamp(),
  });

  // Hook into Spot Points economy: Award the Spotter (ratedUserId) points for a successful handoff
  await awardSuccessfulHandoff(ratedUserId, handoffId).catch(console.error);

  // If the location was accurate, award the bonus as well
  if (locationAccurate) {
    await awardAccuracyBonus(ratedUserId, handoffId).catch(console.error);
  }

  return true;
}

/**
 * Dynamically calculates a user's reputation by querying their spotterRatings.
 * This replaces storing cached averages on the User profile (which is vulnerable without Cloud Functions).
 */
export async function getSpotterReputation(userId: string): Promise<{
  ratingAverage: number;
  ratingCount: number;
  accuracyPercentage: number;
  spotsReported: number;
  successfulHandoffs: number;
}> {
  const ratingsCol = collection(db, 'spotterRatings');
  const q = query(ratingsCol, where('ratedUserId', '==', userId));
  const snapshot = await getDocs(q);

  let totalScore = 0;
  let successfulHandoffs = 0;
  const ratingCount = snapshot.size;

  snapshot.forEach((doc) => {
    const data = doc.data();
    totalScore += data.score || 0;
    if (data.locationAccurate) {
      successfulHandoffs += 1;
    }
  });

  const ratingAverage = ratingCount > 0 ? Math.round((totalScore / ratingCount) * 10) / 10 : 0;
  
  // SpotsReported would ideally come from the number of completed parking sessions.
  // For V1, we estimate spotsReported >= ratingCount. (Usually we'd count sessions).
  // Let's query completed sessions to get actual spotsReported.
  const sessionsCol = collection(db, 'parkingSessions');
  const sessionsQ = query(sessionsCol, where('userId', '==', userId), where('status', '==', 'completed'));
  const sessionsSnap = await getDocs(sessionsQ);
  const spotsReported = sessionsSnap.size;

  const accuracyPercentage = spotsReported > 0 
    ? Math.round((successfulHandoffs / spotsReported) * 100) 
    : (ratingCount > 0 ? Math.round((successfulHandoffs / ratingCount) * 100) : 0);

  return {
    ratingAverage,
    ratingCount,
    accuracyPercentage,
    spotsReported,
    successfulHandoffs
  };
}

/**
 * Helper to determine how a user's identity should be displayed publicly
 */
export function getPublicSpotterIdentity(
  user: User,
  ratingAverage: number,
  accuracyPercentage: number
): {
  displayName: string;
  displayImageUrl: string | null;
  ratingAverage?: number;
  accuracyPercentage?: number;
} | null {
  if (!user || user.privacyMode === 'hidden') {
    return null; // Don't show identity
  }

  if (user.privacyMode === 'anonymous') {
    return {
      displayName: 'Anonymous Spotter',
      displayImageUrl: null,
      ratingAverage,
      accuracyPercentage,
    };
  }

  // Public Mode
  return {
    displayName: user.username ? `@${user.username}` : 'Spotter',
    displayImageUrl: user.profileImageUrl || null,
    ratingAverage,
    accuracyPercentage,
  };
}
