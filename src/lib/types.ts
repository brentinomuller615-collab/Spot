export type PrivacyMode = 'public' | 'anonymous' | 'hidden';

export interface User {
  id: string;
  points: number;
  username?: string;
  usernameNormalized?: string;
  profileImageUrl?: string;
  privacyMode?: PrivacyMode;
  createdAt: string;
}

export type ParkingSessionStatus = 'active' | 'completed';

export interface ParkingSession {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationName: string;
  startedAt: string; // ISO string
  endedAt?: string;   // ISO string
  estimatedDuration?: string; // e.g. "15 min", "30 min", "1 hour", "2 hours", "3+ hours"
  status: ParkingSessionStatus;
  pointsAwarded: number;
  municipalParkingId?: number;
}

export type LikelihoodStatus = 'high' | 'moderate' | 'low';

export interface ParkingZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters/pixels for mock representation
  likelihoodScore: number; // 0 to 100
  likelihoodStatus: LikelihoodStatus;
}

export interface Destination {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  zones: ParkingZone[];
}

export interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  logoUrl?: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  address?: string;
  rating?: number;
  ratingCount?: number;
  active: boolean;
  createdAt: string;
}

export interface Deal {
  id: string;
  businessId: string;
  title: string;
  description: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
}

export interface DealAnalyticsEvent {
  id?: string;
  eventType: 'deal_impression' | 'deal_opened' | 'deal_navigate_clicked';
  userId?: string;
  businessId: string;
  dealId: string;
  timestamp: string;
  // approximate location context if needed
  latitude?: number;
  longitude?: number;
}

export interface SpotterRating {
  id: string;
  ratedUserId: string;
  ratingUserId: string;
  handoffId: string;
  score: number;
  locationAccurate: boolean;
  createdAt: string;
}

export type PointTransactionType = 
  | 'parking_contribution' 
  | 'leaving_report' 
  | 'successful_handoff' 
  | 'accuracy_bonus' 
  | 'reward_redemption' 
  | 'adjustment';

export interface SpotPointsTransaction {
  id: string;
  userId: string;
  type: PointTransactionType;
  amount: number;
  description: string;
  referenceId: string;
  createdAt: string;
}

export interface SpotPointsAccount {
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: string;
}

export interface Reward {
  id: string;
  businessId: string;
  title: string;
  description: string;
  pointsCost: number;
  imageUrl?: string;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  pointsCost: number;
  status: 'reserved' | 'redeemed' | 'cancelled' | 'expired';
  createdAt: string;
  redeemedAt?: string;
}
