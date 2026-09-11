import React, { useState } from 'react';
import { updateBusinessDoc } from '../../lib/services/dealsService';
import { uploadDealImageToCloudinary } from '../../lib/services/cloudinaryService';
import { Business, BusinessHours } from '../../lib/types';

interface BusinessSettingsProps {
  businessProfile: Business;
  onUpdate: (updatedProfile: Business) => void;
}

const DEFAULT_HOURS = {
  monday: { open: '08:00', close: '17:00', closed: false },
  tuesday: { open: '08:00', close: '17:00', closed: false },
  wednesday: { open: '08:00', close: '17:00', closed: false },
  thursday: { open: '08:00', close: '17:00', closed: false },
  friday: { open: '08:00', close: '17:00', closed: false },
  saturday: { open: '09:00', close: '15:00', closed: false },
  sunday: { open: '09:00', close: '15:00', closed: true },
};

export default function BusinessSettings({ businessProfile, onUpdate }: BusinessSettingsProps) {
  const [formData, setFormData] = useState({
    name: businessProfile.name || '',
    address: businessProfile.address || '',
    hours: businessProfile.hours || DEFAULT_HOURS,
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(businessProfile.imageUrl || null);
  const [imageRemoved, setImageRemoved] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB.');
      return;
    }

    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageRemoved(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      let newImageUrl = businessProfile.imageUrl || null;
      if (imageFile) {
        newImageUrl = await uploadDealImageToCloudinary(imageFile);
      } else if (imageRemoved) {
        newImageUrl = null;
      }

      const updatePayload: any = {
        name: formData.name,
        address: formData.address,
        hours: formData.hours,
      };
      
      if (imageFile || imageRemoved) {
        updatePayload.imageUrl = newImageUrl;
      }

      await updateBusinessDoc(businessProfile.id, updatePayload);
      
      onUpdate({
        ...businessProfile,
        name: formData.name,
        address: formData.address,
        hours: formData.hours,
        imageUrl: newImageUrl || undefined,
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update business profile:', err);
      setError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-8 max-w-2xl">
      <div className="bg-spot-cream rounded-3xl shadow-[0_4px_0_0_#171717] border-2 border-spot-ink p-6 md:p-8 overflow-hidden">
        <h3 className="text-3xl font-black text-spot-ink tracking-tight mb-8">Business Profile</h3>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-spot-red text-white font-bold border-2 border-spot-ink shadow-[0_2px_0_0_#171717] flex items-start space-x-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-spot-green text-spot-ink font-black border-2 border-spot-ink shadow-[0_2px_0_0_#171717] flex items-start space-x-3">
            <span className="text-xl mt-0.5">✅</span>
            <p className="mt-1">Changes saved successfully!</p>
          </div>
        )}
        
        <div className="space-y-8">
          <div className="pb-8 border-b-2 border-spot-ink/10">
            <label className="block text-xs font-black text-spot-ink uppercase tracking-widest mb-4">Profile Picture</label>
            <div className="flex items-center space-x-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-spot-yellow border-2 border-spot-ink shadow-[0_2px_0_0_#171717] shrink-0 flex items-center justify-center transform -rotate-2">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl transform hover:scale-110 transition-transform cursor-default">🏪</span>
                )}
              </div>
              <div className="flex flex-col space-y-3">
                <div className="flex space-x-3">
                  <label className="cursor-pointer px-4 py-2 bg-white text-spot-ink border-2 border-spot-ink shadow-[0_2px_0_0_#171717] active:shadow-none active:translate-y-0.5 hover:bg-black/5 font-black rounded-xl transition-all text-sm">
                    {imagePreview ? 'Change Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {imagePreview && (
                    <button 
                      type="button" 
                      onClick={handleRemoveImage}
                      className="px-4 py-2 text-sm font-black text-spot-red hover:bg-spot-red/10 border-2 border-transparent hover:border-spot-red/20 rounded-xl transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs font-bold text-spot-muted">JPG, PNG, or WebP. Max 5MB.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-spot-ink uppercase tracking-widest mb-2">Business Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-white border-2 border-spot-ink/20 focus:border-spot-ink rounded-xl px-4 py-3 outline-none transition-all shadow-[0_2px_0_0_transparent] focus:shadow-[0_4px_0_0_#171717] font-bold text-spot-ink" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-spot-ink uppercase tracking-widest mb-2">Address / Location</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full bg-white border-2 border-spot-ink/20 focus:border-spot-ink rounded-xl px-4 py-3 outline-none transition-all shadow-[0_2px_0_0_transparent] focus:shadow-[0_4px_0_0_#171717] font-bold text-spot-ink" 
            />
          </div>
          
          <div className="pt-8 border-t-2 border-spot-ink/10">
            <h4 className="text-2xl font-black text-spot-ink tracking-tight mb-6">Business Hours</h4>
            <div className="space-y-3">
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
                    <div className="w-2/3 text-right text-spot-muted text-xs font-black uppercase tracking-widest pr-2">
                      Closed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-8 border-t-2 border-spot-ink/10 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-spot-orange hover:bg-spot-orange/90 text-white border-2 border-spot-ink shadow-[0_4px_0_0_#171717] active:shadow-none active:translate-y-1 font-black py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_#171717]"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
