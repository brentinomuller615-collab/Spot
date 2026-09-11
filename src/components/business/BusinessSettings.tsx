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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <h3 className="text-xl font-bold mb-6">Business Profile</h3>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm border border-red-200 dark:border-red-800 flex items-start space-x-3">
            <span className="text-xl">⚠️</span>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm border border-green-200 dark:border-green-800/50 flex items-start space-x-3">
            <span className="text-xl">✅</span>
            <p className="mt-0.5 font-bold">Changes saved successfully!</p>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Profile Picture</label>
            <div className="flex items-center space-x-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🏪</span>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-3">
                  <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-semibold rounded-lg transition-colors text-slate-800 dark:text-slate-200 text-center">
                    {imagePreview ? 'Change Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {imagePreview && (
                    <button 
                      type="button" 
                      onClick={handleRemoveImage}
                      className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">JPG, PNG, or WebP. Max 5MB.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Business Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Address / Location</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-all" 
            />
          </div>
          
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-lg font-bold mb-4">Business Hours</h4>
            <div className="space-y-3">
              {Object.entries(formData.hours).map(([day, hours]) => (
                <div key={day} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3 w-1/3">
                    <input 
                      type="checkbox" 
                      checked={!hours.closed}
                      onChange={(e) => {
                        const newHours = { ...formData.hours, [day]: { ...hours, closed: !e.target.checked } };
                        setFormData({ ...formData, hours: newHours as any });
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-white border-slate-300"
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
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                      <span className="text-slate-400">-</span>
                      <input 
                        type="time" 
                        value={hours.close}
                        onChange={(e) => {
                          const newHours = { ...formData.hours, [day]: { ...hours, close: e.target.value } };
                          setFormData({ ...formData, hours: newHours as any });
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="w-2/3 text-right text-slate-400 text-sm font-semibold pr-2">
                      Closed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-500/20 active:scale-95"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
