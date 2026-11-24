import { Business, Deal } from '../types';
import { calculateDistanceMeters } from '../utils/geo';

// No hardcoded demo businesses — all business data lives in Firestore.
// Mock deals still reference Firestore-backed businesses via businessId.
const MOCK_BUSINESSES: Business[] = [];

const MOCK_DEALS: Deal[] = [
  {
    id: 'd-1',
    businessId: 'b-1',
    title: 'Coffee + Croissant — R45',
    description: 'Get a flat white and a butter croissant for only R45. Available today until 17:00.',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'd-2',
    businessId: 'b-2',
    title: 'Free Fries with any Smash Burger',
    description: 'Show this deal at the counter to get a free side of fries with any burger purchase.',
    active: true,
    createdAt: new Date().toISOString(),
  }
];

import { collection, addDoc, getDocs, getDoc, doc, setDoc, serverTimestamp, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadDealImageToCloudinary } from './cloudinaryService';

export function isDealActive(deal: { active: boolean; expiresAt?: string }): boolean {
  if (!deal.active) return false;
  if (deal.expiresAt) {
    const expiryTime = new Date(deal.expiresAt).getTime();
    if (!isNaN(expiryTime) && expiryTime <= Date.now()) {
      return false;
    }
  }
  return true;
}

export async function getActiveDeals(latitude: number, longitude: number): Promise<{deal: Deal, business: Business, distanceMeters: number}[]> {
  const results: {deal: Deal, business: Business, distanceMeters: number}[] = [];
  
  // 1. Fetch Deals from Firestore
  try {
    const dealsCol = collection(db, 'deals');
    const q = query(dealsCol, where('active', '==', true));
    const snapshot = await getDocs(q);
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const deal: Deal = {
        id: docSnapshot.id,
        businessId: data.businessId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        expiresAt: data.expiresAt,
        active: data.active,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      };
      
      // Filter out expired deals
      if (!isDealActive(deal)) {
        continue;
      }

      const business = await getBusinessById(deal.businessId);
      if (business && business.active) {
        const distanceMeters = calculateDistanceMeters(latitude, longitude, business.latitude, business.longitude);
        results.push({ deal, business, distanceMeters });
      }
    }
  } catch (err) {
    console.error('Failed to fetch deals from Firestore:', err);
  }

  // 2. Add Mock Deals (avoid duplicates if we pushed them locally)
  for (const deal of MOCK_DEALS) {
    if (!isDealActive(deal)) continue;
    // Skip if we already got this deal from Firestore (mock might have matching ID if we just created it)
    if (results.some(r => r.deal.id === deal.id)) continue;
    
    const business = await getBusinessById(deal.businessId);
    if (!business || !business.active) continue;
    
    const distanceMeters = calculateDistanceMeters(latitude, longitude, business.latitude, business.longitude);
    results.push({ deal, business, distanceMeters });
  }
  
  // Sort by distance
  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function getDealsForBusiness(businessId: string): Promise<Deal[]> {
  const results: Deal[] = [];
  try {
    const dealsCol = collection(db, 'deals');
    const q = query(dealsCol, where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      results.push({
        id: docSnapshot.id,
        businessId: data.businessId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        expiresAt: data.expiresAt,
        active: data.active,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Failed to fetch deals for business from Firestore:', err);
    throw err; // Let caller handle it
  }
  
  // No mock logic needed for business dashboard since it relies purely on firestore now
  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getBusinessById(businessId: string): Promise<Business | null> {
  // Check mock first
  const mockBus = MOCK_BUSINESSES.find(b => b.id === businessId);
  if (mockBus) return mockBus;
  
  // Check Firestore
  try {
    const docRef = doc(db, 'businesses', businessId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        category: data.category,
        logoUrl: data.logoUrl,
        imageUrl: data.imageUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        hours: data.hours,
        rating: data.rating,
        ratingCount: data.ratingCount,
        active: data.active,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      } as Business;
    }
  } catch (err) {
    console.error('Failed to fetch business by ID:', err);
  }
  
  return null;
}

let cachedBusinesses: Business[] | null = null;
let businessesCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getAllBusinesses(): Promise<Business[]> {
  const now = Date.now();
  if (cachedBusinesses && (now - businessesCacheTime) < CACHE_TTL) {
    return cachedBusinesses;
  }

  const results: Business[] = [];

  try {
    const busCol = collection(db, 'businesses');
    const q = query(busCol, where('active', '==', true));
    const snapshot = await getDocs(q);
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      results.push({
        id: docSnapshot.id,
        name: data.name,
        description: data.description,
        category: data.category,
        logoUrl: data.logoUrl,
        imageUrl: data.imageUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        hours: data.hours,
        rating: data.rating,
        ratingCount: data.ratingCount,
        active: data.active,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      } as Business);
    }
  } catch (err) {
    console.error('Failed to fetch businesses:', err);
  }

  cachedBusinesses = results;
  businessesCacheTime = now;
  return results;
}

export async function createDeal(businessId: string, title: string, description: string, expiresAt?: string | null): Promise<Deal> {
  const dealsCol = collection(db, 'deals');
  const dealData: any = {
    businessId,
    title,
    description,
    active: true,
    createdAt: serverTimestamp(),
  };

  if (expiresAt) {
    dealData.expiresAt = expiresAt;
  }

  const docRef = await addDoc(dealsCol, dealData);

  const newDeal: Deal = {
    id: docRef.id,
    businessId,
    title,
    description,
    expiresAt: expiresAt || undefined,
    active: true,
    createdAt: new Date().toISOString(),
  };

  // Push to local mock array so it appears immediately in the UI without needing a refresh
  MOCK_DEALS.unshift(newDeal);

  return newDeal;
}

export async function createDealWithImage(businessId: string, title: string, description: string, imageFile: File, expiresAt?: string | null): Promise<Deal> {
  const dealsCol = collection(db, 'deals');
  const docRef = doc(dealsCol);
  const dealId = docRef.id;

  let imageUrl = null;

  try {
    imageUrl = await uploadDealImageToCloudinary(imageFile);
  } catch (err: any) {
    console.error('Failed to upload image:', err);
    throw new Error(err.message || 'Image upload failed. Please try again.');
  }

  const dealData: any = {
    businessId,
    title,
    description,
    imageUrl,
    active: true,
    createdAt: serverTimestamp(),
  };

  if (expiresAt) {
    dealData.expiresAt = expiresAt;
  }

  await setDoc(docRef, dealData);

  const newDeal: Deal = {
    id: dealId,
    businessId,
    title,
    description,
    imageUrl,
    expiresAt: expiresAt || undefined,
    active: true,
    createdAt: new Date().toISOString(),
  };

  MOCK_DEALS.unshift(newDeal);

  return newDeal;
}

export async function updateDeal(dealId: string, data: Partial<Deal>): Promise<void> {
  const docRef = doc(db, 'deals', dealId);
  const updateData: any = { ...data };

  delete updateData.id;
  delete updateData.createdAt;
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  await setDoc(docRef, updateData, { merge: true });

  // Update in local mock array if present
  const mockIdx = MOCK_DEALS.findIndex(d => d.id === dealId);
  if (mockIdx !== -1) {
    MOCK_DEALS[mockIdx] = { ...MOCK_DEALS[mockIdx], ...updateData };
  }
}

export async function createBusinessDoc(businessId: string, name: string, category: string, address: string, latitude: number, longitude: number, hours?: any): Promise<void> {
  const docRef = doc(db, 'businesses', businessId);
  await setDoc(docRef, {
    name,
    category,
    address,
    description: 'A Spot Business Partner', // Default
    latitude,
    longitude,
    hours: hours || null,
    active: true,
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateBusinessDoc(businessId: string, data: Partial<Business>): Promise<void> {
  const docRef = doc(db, 'businesses', businessId);
  const updateData: any = { ...data };
  
  // Clean up undefined values and remove id/createdAt to prevent overwrite
  delete updateData.id;
  delete updateData.createdAt;
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  await setDoc(docRef, updateData, { merge: true });
}

/**
 * Subscribes to all active businesses in Firestore in real time.
 * Calls the callback whenever the set of active businesses changes.
 * Returns an unsubscribe function.
 */
export function subscribeToBusinesses(callback: (businesses: Business[]) => void): Unsubscribe {
  const busCol = collection(db, 'businesses');
  const q = query(busCol, where('active', '==', true));

  return onSnapshot(q, (snapshot) => {
    const businesses: Business[] = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        name: data.name,
        description: data.description,
        category: data.category,
        logoUrl: data.logoUrl,
        imageUrl: data.imageUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        hours: data.hours,
        rating: data.rating,
        ratingCount: data.ratingCount,
        active: data.active,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      } as Business;
    });
    callback(businesses);
  }, (err) => {
    console.error('[subscribeToBusinesses] Firestore error:', err);
  });
}
