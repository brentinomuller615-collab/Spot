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
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-3xl font-black text-spot-ink tracking-tight mb-2">Manage Deals</h3>
          <p className="text-spot-muted font-bold">Create and manage local promotions to attract parkers.</p>
        </div>
        <button
          onClick={() => setIsCreateDealOpen(true)}
          className="bg-spot-orange hover:bg-spot-orange/90 text-white font-black py-3 px-6 rounded-xl border-2 border-spot-ink shadow-[0_4px_0_0_#171717] active:shadow-none active:translate-y-1 transition-all"
        >
          + New Deal
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-spot-muted font-black uppercase tracking-widest animate-pulse text-sm">Loading deals...</div>
      ) : error ? (
        <div className="p-8 bg-spot-red text-white border-2 border-spot-ink shadow-[0_4px_0_0_#171717] rounded-3xl text-center transform rotate-1">
          <p className="font-black text-xl mb-2">Error loading deals</p>
          <p className="font-bold text-white/80">{error}</p>
          <button onClick={fetchDeals} className="mt-6 px-6 py-2 bg-white text-spot-ink border-2 border-spot-ink shadow-[0_2px_0_0_#171717] active:shadow-none active:translate-y-0.5 rounded-xl font-black transition-all">Try Again</button>
        </div>
      ) : deals.length === 0 ? (
        <div className="p-16 bg-spot-cream rounded-3xl shadow-[0_4px_0_0_#171717] border-2 border-spot-ink text-center transform -rotate-1">
          <div className="text-6xl transform hover:scale-110 transition-transform cursor-default mb-6 inline-block">🏷️</div>
          <h3 className="text-2xl font-black text-spot-ink mb-2">No active deals</h3>
          <p className="text-spot-muted font-bold max-w-sm mx-auto mb-8">Create a promotion to encourage parkers to visit your business.</p>
          <button
            onClick={() => setIsCreateDealOpen(true)}
            className="text-spot-orange font-black hover:text-spot-orange/80 transition-colors uppercase tracking-widest text-sm"
          >
            Create your first deal →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {deals.map(deal => (
            <div key={deal.id} className="bg-spot-cream rounded-3xl shadow-[0_4px_0_0_#171717] border-2 border-spot-ink overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform">
              {deal.imageUrl && (
                <div className="w-full h-40 bg-spot-yellow border-b-2 border-spot-ink">
                  <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-black text-xl text-spot-ink leading-tight pr-4">{deal.title}</h4>
                  <span className="px-3 py-1 bg-spot-green text-spot-ink text-[10px] font-black uppercase tracking-widest rounded-xl border-2 border-spot-ink shadow-[0_2px_0_0_#171717]">Active</span>
                </div>
                <p className="text-spot-muted font-bold text-sm leading-relaxed">{deal.description}</p>
              </div>
              <div className="px-6 py-4 bg-white border-t-2 border-spot-ink text-[10px] uppercase tracking-widest font-black text-spot-ink flex justify-between items-center">
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
