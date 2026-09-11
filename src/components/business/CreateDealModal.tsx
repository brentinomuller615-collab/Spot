import React, { useState } from 'react';
import { createDealWithImage } from '../../lib/services/dealsService';

interface CreateDealModalProps {
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDealModal({ businessId, onClose, onSuccess }: CreateDealModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    if (!imageFile) {
      setError('Please upload a deal image.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createDealWithImage(businessId, title, description, imageFile);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create deal:', err);
      setError(err.message || 'An error occurred while creating the deal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-spot-ink/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-spot-cream rounded-3xl shadow-[0_8px_0_0_#171717] w-full max-w-md p-8 border-4 border-spot-ink relative overflow-hidden transform rotate-1">
        <h2 className="text-2xl font-black text-spot-ink uppercase tracking-widest mb-6">Create Deal</h2>
        
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
          
          <div className="mb-8">
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
                <span>Create Deal</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
