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

export async function getActiveDeals(latitude: number, longitude: number): Promise<{deal: Deal, business: Business, distanceMeters: number}[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const results = [];
  
  for (const deal of MOCK_DEALS) {
    if (!deal.active) continue;
    
    const business = MOCK_BUSINESSES.find(b => b.id === deal.businessId);
    if (!business || !business.active) continue;
    
    const distanceMeters = calculateDistanceMeters(latitude, longitude, business.latitude, business.longitude);
    
    results.push({ deal, business, distanceMeters });
  }
  
  // Sort by distance
  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function getBusinessById(businessId: string): Promise<Business | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_BUSINESSES.find(b => b.id === businessId) || null;
}
