import React, { useEffect, useState } from 'react';
import { getDealsForBusiness } from '../../lib/services/dealsService';
import { Deal } from '../../lib/types';
import CreateDealModal from './CreateDealModal';

interface ManageDealsProps {
  businessId: string;
}

export default function ManageDeals({ businessId }: ManageDealsProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false);

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDealsForBusiness(businessId);
      setDeals(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load deals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchDeals();
    }
  }, [businessId]);

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">Manage Deals</h3>
          <p className="text-slate-500">Create and manage local promotions to attract parkers.</p>
        </div>
        <button
          onClick={() => setIsCreateDealOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors shadow-md shadow-blue-500/20"
        >
          + New Deal
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 animate-pulse">Loading deals...</div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 border border-red-200 dark:border-red-800 text-center">
          <p className="font-bold mb-2">Error loading deals</p>
          <p>{error}</p>
          <button onClick={fetchDeals} className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm font-semibold">Try Again</button>
        </div>
      ) : deals.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏷️</span>
          </div>
          <h3 className="text-lg font-bold mb-2">No active deals</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">Create a promotion to encourage parkers to visit your business.</p>
          <button
            onClick={() => setIsCreateDealOpen(true)}
            className="text-blue-600 hover:text-blue-700 font-bold"
          >
            Create your first deal →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map(deal => (
            <div key={deal.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
              {deal.imageUrl && (
                <div className="w-full h-32 bg-slate-200 dark:bg-slate-800">
                  <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-lg leading-tight">{deal.title}</h4>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-md">Active</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{deal.description}</p>
              </div>
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex justify-between items-center">
                <span>Created {new Date(deal.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateDealOpen && (
        <CreateDealModal 
          businessId={businessId} 
          onClose={() => setIsCreateDealOpen(false)} 
          onSuccess={() => {
            setIsCreateDealOpen(false);
            fetchDeals();
          }} 
        />
      )}
    </div>
  );
}
