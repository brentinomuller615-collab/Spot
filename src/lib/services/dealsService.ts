import { Business, Deal } from '../types';
import { calculateDistanceMeters } from '../utils/geo';

// Mock deals for now, since we don't have a real backend populated with them yet.
const MOCK_BUSINESSES: Business[] = [
  {
    id: 'b-1',
    name: 'The Daily Grind',
    description: 'Artisan coffee and pastries.',
    category: 'Cafe',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600',
    latitude: -33.9340,
    longitude: 18.8580,
    rating: 4.7,
    ratingCount: 124,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b-2',
    name: 'Burger Joint',
    description: 'Best smash burgers in town.',
    category: 'Restaurant',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
    latitude: -33.9320,
    longitude: 18.8600,
    rating: 4.5,
    ratingCount: 89,
    active: true,
    createdAt: new Date().toISOString(),
  }
];

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

import { collection, addDoc, getDocs, getDoc, doc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadDealImageToCloudinary } from './cloudinaryService';

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
        active: data.active,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      };
      
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
    if (!deal.active) continue;
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
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        hours: data.hours,
        active: data.active,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      } as Business;
    }
  } catch (err) {
    console.error('Failed to fetch business by ID:', err);
  }
  
  return null;
}

export async function createDeal(businessId: string, title: string, description: string): Promise<Deal> {
  const dealsCol = collection(db, 'deals');
  const docRef = await addDoc(dealsCol, {
    businessId,
    title,
    description,
    active: true,
    createdAt: serverTimestamp(),
  });

  const newDeal: Deal = {
    id: docRef.id,
    businessId,
    title,
    description,
    active: true,
    createdAt: new Date().toISOString(),
  };

  // Push to local mock array so it appears immediately in the UI without needing a refresh
  MOCK_DEALS.unshift(newDeal);

  return newDeal;
}

export async function createDealWithImage(businessId: string, title: string, description: string, imageFile: File): Promise<Deal> {
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

  await setDoc(docRef, {
    businessId,
    title,
    description,
    imageUrl,
    active: true,
    createdAt: serverTimestamp(),
  });

  const newDeal: Deal = {
    id: dealId,
    businessId,
    title,
    description,
    imageUrl,
    active: true,
    createdAt: new Date().toISOString(),
  };

  MOCK_DEALS.unshift(newDeal);

  return newDeal;
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
