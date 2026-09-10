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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-slate-100 selection:bg-blue-200 dark:selection:bg-blue-900">
      
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-8 px-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex flex-col items-center flex-1">
              <div className={`w-3 h-3 rounded-full mb-2 transition-colors ${step >= s ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
              <div className={`h-1 w-full rounded-full transition-colors ${step > s ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-8 md:p-10 relative overflow-hidden">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-6 flex items-center justify-center">
                <span className="text-3xl font-black text-blue-600">S</span>
              </div>
              <h2 className="text-3xl font-black mb-4 tracking-tight">Welcome to Spot Business</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
                Connect your business to the Spot network. Understand local parking activity, create promotions, and attract parkers directly to your storefront.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-black mb-2 tracking-tight">Business Details</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Tell us a bit about your establishment.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    placeholder="e.g. The Burger Joint"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-all"
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
              <h2 className="text-2xl font-black mb-2 tracking-tight">Business Hours</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">When are you open for business?</p>
              
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {Object.entries(formData.hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3 w-1/3">
                      <input 
                        type="checkbox" 
                        checked={!hours.closed}
                        onChange={(e) => {
                          const newHours = { ...formData.hours, [day]: { ...hours, closed: !e.target.checked } };
                          setFormData({ ...formData, hours: newHours as any });
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="font-semibold capitalize text-sm">{day.substring(0, 3)}</span>
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
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm outline-none"
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                          type="time" 
                          value={hours.close}
                          onChange={(e) => {
                            const newHours = { ...formData.hours, [day]: { ...hours, close: e.target.value } };
                            setFormData({ ...formData, hours: newHours as any });
                          }}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm outline-none"
                        />
                      </div>
                    ) : (
                      <div className="w-2/3 text-right text-slate-400 text-sm font-semibold">
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
              <h2 className="text-2xl font-black mb-2 tracking-tight">Location</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Where is your business located? This helps us map nearby parking activity.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Street Address</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="123 Main St..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg flex items-start space-x-3">
                  <span className="text-blue-600 mt-0.5">ℹ️</span>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    We&apos;ll use this to generate a geographic likelihood zone around your store, helping parkers understand how easy it is to visit you.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 border-4 border-white dark:border-slate-950 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-black mb-2 tracking-tight">You&apos;re all set!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Your business profile is ready. Let&apos;s head over to the dashboard to see live parking intelligence.
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm border border-red-200 dark:border-red-800">
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}

          <div className="mt-10 flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
            {step > 1 ? (
              <button 
                onClick={handleBack}
                className="text-slate-500 hover:text-slate-700 font-bold px-4 py-2 transition-colors"
              >
                Back
              </button>
            ) : (
              <div></div> // Empty div for flex spacing
            )}
            
            <button 
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md shadow-blue-500/20 active:scale-95"
            >
              {isSubmitting ? 'Saving...' : (step === 5 ? 'Go to Dashboard' : (step === 1 ? 'Get Started' : 'Continue'))}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
