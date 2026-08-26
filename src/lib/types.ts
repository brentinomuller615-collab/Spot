export interface User {
  id: string;
  email: string;
  points: number;
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
