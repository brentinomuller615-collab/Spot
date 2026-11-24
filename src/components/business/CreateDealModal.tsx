import React, { useState } from 'react';
import { createDealWithImage, updateDeal } from '../../lib/services/dealsService';
import { uploadDealImageToCloudinary } from '../../lib/services/cloudinaryService';
import { Deal } from '../../lib/types';

interface DealModalProps {
  businessId: string;
  deal?: Deal | null; // If provided, edit mode. If null/undefined, create mode.
  onClose: () => void;
  onSuccess: () => void;
}

export default function DealModal({ businessId, deal, onClose, onSuccess }: DealModalProps) {
  const isEditing = Boolean(deal);

  const [title, setTitle] = useState(deal?.title || '');
  const [description, setDescription] = useState(deal?.description || '');

  // Helper to convert ISO string to HTML datetime-local format (YYYY-MM-DDTHH:mm)
  const formatForDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    // Format to local date and time string: YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [hasExpiry, setHasExpiry] = useState<boolean>(Boolean(deal?.expiresAt));
  const [expiresAtLocal, setExpiresAtLocal] = useState<string>(
    deal?.expiresAt ? formatForDateTimeLocal(deal.expiresAt) : ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(deal?.imageUrl || null);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    if (!isEditing && !imageFile && !imagePreview) {
      setError('Please upload a deal image.');
      return;
    }

    let finalExpiresAt: string | null = null;
    if (hasExpiry) {
      if (!expiresAtLocal) {
        setError('Please set an expiration date and time, or uncheck "Set expiration date".');
        return;
      }
      const parsedDate = new Date(expiresAtLocal);
      if (isNaN(parsedDate.getTime())) {
        setError('Invalid expiration date and time.');
        return;
      }
      finalExpiresAt = parsedDate.toISOString();
    }

    setLoading(true);
    setError(null);
    try {
      if (isEditing && deal) {
        let newImageUrl = deal.imageUrl;
        if (imageFile) {
          newImageUrl = await uploadDealImageToCloudinary(imageFile);
        }

        await updateDeal(deal.id, {
          title: title.trim(),
          description: description.trim(),
          imageUrl: newImageUrl,
          expiresAt: finalExpiresAt || undefined,
          active: true, // Reactivate if edited/renewed
        });
      } else {
        await createDealWithImage(businessId, title.trim(), description.trim(), imageFile!, finalExpiresAt);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save deal:', err);
      setError(err.message || 'An error occurred while saving the deal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-spot-ink/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-spot-cream rounded-3xl shadow-[0_8px_0_0_#171717] w-full max-w-md p-8 border-4 border-spot-ink relative overflow-hidden transform rotate-1 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-black text-spot-ink uppercase tracking-widest mb-6">
          {isEditing ? 'Edit Deal' : 'Create Deal'}
        </h2>
        
        {error && (
          <div className="mb-6 p-4 bg-spot-red text-white font-bold border-2 border-spot-ink shadow-[0_2px_0_0_#171717] rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-xs font-black text-spot-ink uppercase tracking-widest mb-2">Deal Title</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 50% off Coffee"
              className="w-full bg-white border-2 border-spot-ink/20 focus:border-spot-ink rounded-xl px-4 py-3 outline-none transition-all shadow-[0_2px_0_0_transparent] focus:shadow-[0_4px_0_0_#171717] font-bold text-spot-ink placeholder-spot-muted"
              maxLength={50}
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-black text-spot-ink uppercase tracking-widest mb-2">Deal Image</label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-spot-ink shadow-[0_2px_0_0_#171717] mb-2 bg-spot-yellow">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-3 right-3 bg-spot-red text-white border-2 border-spot-ink shadow-[0_2px_0_0_#171717] rounded-full p-1.5 hover:bg-spot-red/90 flex items-center justify-center w-8 h-8 transition-transform active:translate-y-0.5 active:shadow-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="w-full bg-white border-2 border-spot-ink/20 rounded-xl px-4 py-3 text-sm font-bold text-spot-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-2 file:border-spot-ink file:shadow-[0_2px_0_0_#171717] file:text-xs file:font-black file:bg-spot-yellow file:text-spot-ink hover:file:bg-spot-yellow/80 hover:file:translate-y-0.5 hover:file:shadow-none file:transition-all file:cursor-pointer cursor-pointer focus:border-spot-ink transition-all"
              />
            )}
          </div>
          
          <div className="mb-5">
            <label className="block text-xs font-black text-spot-ink uppercase tracking-widest mb-2">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your promotion..."
              rows={3}
              className="w-full bg-white border-2 border-spot-ink/20 focus:border-spot-ink rounded-xl px-4 py-3 outline-none transition-all shadow-[0_2px_0_0_transparent] focus:shadow-[0_4px_0_0_#171717] font-bold text-spot-ink placeholder-spot-muted resize-none"
              maxLength={150}
            />
          </div>

          {/* Deal Expiration Field */}
          <div className="mb-8 p-4 bg-white/70 rounded-2xl border-2 border-spot-ink/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-spot-ink uppercase tracking-widest flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={hasExpiry}
                  onChange={e => {
                    setHasExpiry(e.target.checked);
                    if (!e.target.checked) {
                      setExpiresAtLocal('');
                    } else if (!expiresAtLocal) {
                      // Default to tomorrow same time if blank
                      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                      tomorrow.setMinutes(0);
                      tomorrow.setSeconds(0);
                      setExpiresAtLocal(formatForDateTimeLocal(tomorrow.toISOString()));
                    }
                  }}
                  className="w-4 h-4 rounded border-2 border-spot-ink/20 checked:bg-spot-orange checked:border-spot-ink accent-spot-orange cursor-pointer"
                />
                Set Expiration Date & Time
              </label>
            </div>
            <p className="text-[11px] text-spot-muted font-bold mb-3">
              When expired, this deal will automatically stop showing on the map and customer deal feed.
            </p>

            {hasExpiry && (
              <div className="animate-in fade-in duration-200">
                <input 
                  type="datetime-local"
                  value={expiresAtLocal}
                  onChange={e => setExpiresAtLocal(e.target.value)}
                  className="w-full bg-white border-2 border-spot-ink/20 focus:border-spot-ink rounded-xl px-4 py-2.5 outline-none font-bold text-spot-ink text-sm"
                />
                {expiresAtLocal && (
                  <p className="text-[10px] text-spot-ink/70 font-semibold mt-1.5">
                    Expires: {new Date(expiresAtLocal).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-3 justify-end pt-4 border-t-2 border-spot-ink/10">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="text-spot-ink border-2 border-transparent hover:border-spot-ink/10 hover:bg-black/5 rounded-xl font-black px-5 py-3 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-spot-orange hover:bg-spot-orange/90 text-white border-2 border-spot-ink shadow-[0_4px_0_0_#171717] active:shadow-none active:translate-y-1 font-black py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_#171717] flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create Deal'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
