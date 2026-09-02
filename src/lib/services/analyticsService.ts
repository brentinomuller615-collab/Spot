import { DealAnalyticsEvent } from '../types';

/**
 * Basic analytics service for Deals to track impressions and interactions.
 * In a real application, this would send data to Firebase Analytics or Firestore.
 */
export async function logDealEvent(event: Omit<DealAnalyticsEvent, 'timestamp'>): Promise<void> {
  const fullEvent: DealAnalyticsEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Mock logging to console for now
  console.log('[Analytics] Deal Event:', fullEvent);
  
  // Example of how it would be saved to Firestore later:
  // await addDoc(collection(db, 'analytics_events'), fullEvent);
}
