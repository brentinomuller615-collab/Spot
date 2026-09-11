import React, { useState } from 'react';
import { useParkingSession } from '../../hooks/useParkingSession';
import { createBusinessDoc } from '../../lib/services/dealsService';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useParkingSession();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    address: '',
    hours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '09:00', close: '15:00', closed: true },
    }
  });

  const handleNext = async () => {
    setError(null);
    if (step < 5) {
      setStep(step + 1);
    } else {
      if (user) {
        setIsSubmitting(true);
        try {
          // Hardcoding coordinates for the demo (normally would geocode address)
          await createBusinessDoc(user.id, formData.businessName, formData.category, formData.address, -33.9340, 18.8580, formData.hours);
          onComplete();
        } catch (err: any) {
          console.error('Failed to create business document:', err);
          setError(err.message || 'Failed to save business profile.');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        onComplete();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-spot-cream flex flex-col items-center justify-center p-6 text-spot-ink selection:bg-spot-yellow">
      
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-8 px-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex flex-col items-center flex-1">
              <div className={`w-4 h-4 rounded-full mb-2 transition-all border-2 ${step >= s ? 'bg-spot-orange border-spot-ink shadow-[0_2px_0_0_#171717]' : 'bg-white border-spot-ink/10'}`} />
              <div className={`h-1.5 w-full rounded-full transition-all ${step > s ? 'bg-spot-orange border-t border-b border-spot-ink' : 'bg-white border-t border-b border-spot-ink/10'}`} />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border-2 border-spot-ink shadow-[0_8px_0_0_#171717] p-8 md:p-10 relative overflow-hidden">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 rounded-2xl bg-spot-yellow border-2 border-spot-ink mb-8 flex items-center justify-center transform -rotate-3 shadow-[0_4px_0_0_#171717]">
                <span className="text-3xl font-black text-spot-ink">S</span>
              </div>
              <h2 className="text-3xl font-black mb-4 tracking-tight text-spot-ink">Welcome to Spot Business</h2>
              <p className="text-spot-muted font-bold mb-8 text-lg">
                Connect your business to the Spot network. Understand local parking activity, create promotions, and attract parkers directly to your storefront.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-3xl font-black mb-2 tracking-tight text-spot-ink">Business Details</h2>
              <p className="text-spot-muted font-bold mb-8">Tell us a bit about your establishment.</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-black text-spot-ink uppercase tracking-widest mb-2">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    placeholder="e.g. The Burger Joint"
                    className="w-full bg-white border-2 border-spot-ink/20 focus:border-spot-ink rounded-xl px-4 py-3 outline-none transition-all shadow-[0_2px_0_0_transparent] focus:shadow-[0_4px_0_0_#171717] font-bold text-spot-ink placeholder-spot-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-spot-ink uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-white border-2 border-spot-ink/20 focus:border-spot-ink rounded-xl px-4 py-3 outline-none transition-all shadow-[0_2px_0_0_transparent] focus:shadow-[0_4px_0_0_#171717] font-bold text-spot-ink"
                  >
                    <option value="">Select a category</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Cafe">Cafe</option>
                    <option value="Retail">Retail</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-3xl font-black mb-2 tracking-tight text-spot-ink">Business Hours</h2>
              <p className="text-spot-muted font-bold mb-6">When are you open for business?</p>
              
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(formData.hours).map(([day, hours]) => (
                  <div key={day} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${!hours.closed ? 'bg-spot-cream border-spot-ink/10 shadow-sm' : 'bg-black/5 border-transparent opacity-70'}`}>
                    <div className="flex items-center space-x-3 w-1/3">
                      <input 
                        type="checkbox" 
                        checked={!hours.closed}
                        onChange={(e) => {
                          const newHours = { ...formData.hours, [day]: { ...hours, closed: !e.target.checked } };
                          setFormData({ ...formData, hours: newHours as any });
                        }}
                        className="w-5 h-5 border-2 border-spot-ink/20 checked:bg-spot-orange checked:border-spot-ink accent-spot-orange cursor-pointer"
                      />
                      <span className="font-black uppercase tracking-widest text-[10px] text-spot-ink">{day.substring(0, 3)}</span>
                    </div>
                    
                    {!hours.closed ? (
                      <div className="flex items-center space-x-2 w-2/3 justify-end">
                        <input 
                          type="time" 
                          value={hours.open}
                          onChange={(e) => {
                            const newHours = { ...formData.hours, [day]: { ...hours, open: e.target.value } };
                            setFormData({ ...formData, hours: newHours as any });
                          }}
                          className="bg-white border-2 border-spot-ink/20 focus:border-spot-ink font-bold text-spot-ink rounded-lg px-2 py-1 outline-none text-sm transition-colors"
                        />
                        <span className="text-spot-muted font-black">-</span>
                        <input 
                          type="time" 
                          value={hours.close}
                          onChange={(e) => {
                            const newHours = { ...formData.hours, [day]: { ...hours, close: e.target.value } };
                            setFormData({ ...formData, hours: newHours as any });
                          }}
                          className="bg-white border-2 border-spot-ink/20 focus:border-spot-ink font-bold text-spot-ink rounded-lg px-2 py-1 outline-none text-sm transition-colors"
                        />
                      </div>
                    ) : (
                      <div className="w-2/3 text-right text-spot-muted text-xs font-black uppercase tracking-widest">
                        Closed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-3xl font-black mb-2 tracking-tight text-spot-ink">Location</h2>
              <p className="text-spot-muted font-bold mb-8">Where is your business located? This helps us map nearby parking activity.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-spot-ink uppercase tracking-widest mb-2">Street Address</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="123 Main St..."
                    className="w-full bg-white border-2 border-spot-ink/20 focus:border-spot-ink rounded-xl px-4 py-3 outline-none transition-all shadow-[0_2px_0_0_transparent] focus:shadow-[0_4px_0_0_#171717] font-bold text-spot-ink placeholder-spot-muted"
                  />
                </div>
                
                <div className="p-5 bg-white border-2 border-spot-ink rounded-xl flex items-start space-x-4 shadow-[0_2px_0_0_#171717] transform rotate-1">
                  <span className="text-spot-ink mt-0.5 text-xl">ℹ️</span>
                  <p className="text-sm font-bold text-spot-ink leading-relaxed">
                    We&apos;ll use this to generate a geographic likelihood zone around your store, helping parkers understand how easy it is to visit you.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
              <div className="w-24 h-24 rounded-full bg-spot-green border-4 border-spot-ink flex items-center justify-center mx-auto mb-8 shadow-[0_4px_0_0_#171717] transform -rotate-3">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-3xl font-black mb-2 tracking-tight text-spot-ink">You&apos;re all set!</h2>
              <p className="text-spot-muted font-bold mb-6 text-lg px-4">
                Your business profile is ready. Let&apos;s head over to the dashboard to see live parking intelligence.
              </p>
              {error && (
                <div className="mb-4 p-4 rounded-xl bg-spot-red text-white font-bold border-2 border-spot-ink shadow-[0_2px_0_0_#171717]">
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}

          <div className="mt-10 flex justify-between items-center pt-8 border-t-2 border-spot-ink/10">
            {step > 1 ? (
              <button 
                onClick={handleBack}
                className="text-spot-ink border-2 border-transparent hover:border-spot-ink/10 hover:bg-black/5 rounded-xl font-black px-5 py-3 transition-all"
              >
                Back
              </button>
            ) : (
              <div></div> // Empty div for flex spacing
            )}
            
            <button 
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-spot-orange hover:bg-spot-orange/90 text-white border-2 border-spot-ink shadow-[0_4px_0_0_#171717] active:shadow-none active:translate-y-1 font-black py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_#171717]"
            >
              {isSubmitting ? 'Saving...' : (step === 5 ? 'Go to Dashboard' : (step === 1 ? 'Get Started' : 'Continue'))}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
