import { MunicipalParkingLocation } from '../municipalParking';
import { getLiveParkingActivity, LiveParkingActivity } from './liveActivityService';
import { getHistoricalParkingActivity, HistoricalParkingPattern, getLocalDayAndHour } from './historicalActivityService';

export const SCORE_LOWER_MAX = 39;
export const SCORE_MIXED_MAX = 69;
export const MIN_HISTORICAL_OBSERVATIONS = 5;

export type LikelihoodClassification = 'Lower chance' | 'Mixed' | 'Better chance' | 'unknown';
export type EvidenceLevel = 'low' | 'medium' | 'high';

export interface ParkingLikelihoodResult {
  score: number | null;
  classification: LikelihoodClassification;
  evidenceLevel: EvidenceLevel;
  liveData: LiveParkingActivity | null;
  historicalData: HistoricalParkingPattern | null;
  reason: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function getParkingLikelihood(
  loc: MunicipalParkingLocation,
  destLat: number,
  destLon: number
): Promise<ParkingLikelihoodResult> {
  // Current local time in Africa/Johannesburg
  const now = new Date();
  const { day: dayOfWeek, hour } = getLocalDayAndHour(now);

  // Fetch Live & Historical data for the MUNICIPAL location's coordinates, not the destination
  const [liveData, historicalData] = await Promise.all([
    getLiveParkingActivity(loc.latitude, loc.longitude).catch(() => null),
    getHistoricalParkingActivity(loc.latitude, loc.longitude, dayOfWeek, hour).catch(() => null)
  ]);

  let liveScore: number | null = null;
  let historicalScore: number | null = null;
  let liveReason = '';
  let historicalReason = '';

  const liveTotal = liveData 
    ? liveData.recentArrivals + liveData.recentDepartures + liveData.nearbyActiveSessions 
    : 0;

  // 1. Live Score Calculation
  if (liveData && liveTotal > 0) {
    const liveBalance = liveData.recentDepartures / Math.max(1, liveData.recentArrivals + liveData.nearbyActiveSessions);
    liveScore = clamp(liveBalance * 40 + 20, 0, 100);
    
    if (liveBalance > 1.5) {
      liveReason = 'Recent departures are higher than arrivals.';
    } else if (liveBalance < 0.5) {
      liveReason = 'Many recent arrivals or active sessions.';
    } else {
      liveReason = 'Parking activity is currently mixed.';
    }
  }

  // 2. Historical Score Calculation
  const hasHistorical = historicalData && historicalData.observationCount >= MIN_HISTORICAL_OBSERVATIONS;
  if (hasHistorical) {
    const historicalBalance = historicalData.departures / Math.max(1, historicalData.arrivals);
    const avgDuration = historicalData.averageParkingDuration || 0;
    
    let durationPenalty = 0;
    if (avgDuration > 60) durationPenalty = -10;
    else if (avgDuration > 0 && avgDuration < 30) durationPenalty = 10;

    historicalScore = clamp(historicalBalance * 40 + 20 + durationPenalty, 0, 100);

    if (historicalBalance > 1.5) {
      historicalReason = 'Historically high turnover at this time.';
    } else if (historicalBalance < 0.5) {
      historicalReason = 'Historically fills up at this time.';
    } else {
      historicalReason = 'Historically mixed activity at this time.';
    }
  }

  // 3. Combine Scores
  let finalScore: number | null = null;
  let primaryReason = 'Not enough data yet.';

  if (liveScore !== null && historicalScore !== null) {
    finalScore = Math.round((liveScore * 0.5) + (historicalScore * 0.5));
    // Live reason takes precedence for explainability if live score is strong, else historical
    primaryReason = Math.abs(liveScore - 50) >= Math.abs(historicalScore - 50) 
      ? liveReason 
      : historicalReason;
  } else if (liveScore !== null) {
    finalScore = Math.round(liveScore);
    primaryReason = liveReason;
  } else if (historicalScore !== null) {
    finalScore = Math.round(historicalScore);
    primaryReason = historicalReason;
  }

  // 4. Determine Classification
  let classification: LikelihoodClassification = 'unknown';
  if (finalScore !== null) {
    if (finalScore <= SCORE_LOWER_MAX) classification = 'Lower chance';
    else if (finalScore <= SCORE_MIXED_MAX) classification = 'Mixed';
    else classification = 'Better chance';
  }

  // 5. Determine Evidence Level
  const liveMeaningful = liveTotal >= 3;
  const historicalObs = historicalData ? historicalData.observationCount : 0;
  let evidenceLevel: EvidenceLevel = 'low';

  if (historicalObs >= 20 && liveMeaningful) {
    evidenceLevel = 'high';
  } else if ((historicalObs >= 5 && historicalObs < 20) || liveMeaningful) {
    evidenceLevel = 'medium';
  }

  if (finalScore === null) {
    evidenceLevel = 'low';
    primaryReason = 'Not enough data yet.';
  }

  return {
    score: finalScore,
    classification,
    evidenceLevel,
    liveData,
    historicalData,
    reason: primaryReason
  };
}
