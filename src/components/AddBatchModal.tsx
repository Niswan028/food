import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sprout, Upload, Calendar, IndianRupee, Award, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { LoadingSpinner } from '@/components/ui';
import { CATEGORIES, QUALITY_GRADES, CERTIFICATIONS, CROP_SUGGESTIONS, generateBatchCode } from '@/lib/utils';
import { anchorBatchToChain } from '@/services/blockchainService';
import { QrCodeDisplay } from '@/components/QrCodeDisplay';

interface Props {
  onClose: () => void;
  onCreated: () => void;
  farmerBatchCount: number;
  farmerIndex: number;
}

export function AddBatchModal({ onClose, onCreated, farmerBatchCount, farmerIndex }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createdBatchCode, setCreatedBatchCode] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const [form, setForm] = useState({
    crop_name: '',
    category: 'Vegetables',
    quantity: '',
    unit: 'kg',
    harvest_date: '',
    price_per_unit: '',
    quality_grade: 'A',
    description: '',
  });
  const [certifications, setCertifications] = useState<string[]>([]);

  const toggleCert = (c: string) => {
    setCertifications((prev) => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('produce-photos').upload(fileName, file);
    setUploading(false);
    if (error) {
      toast(`Upload failed: ${error.message}`, 'error');
      return;
    }
    const { data: urlData } = supabase.storage.from('produce-photos').getPublicUrl(fileName);
    setPhotoUrls((prev) => [...prev, urlData.publicUrl]);
    toast('Photo uploaded', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.crop_name || !form.quantity || !form.harvest_date || !form.price_per_unit) {
      toast('Please fill in all required fields', 'warning');
      return;
    }
    setLoading(true);
    const batchCode = generateBatchCode(farmerIndex, farmerBatchCount);
    const { data: batch, error } = await supabase.from('produce_batches').insert({
      batch_code: batchCode,
      farmer_id: user.id,
      crop_name: form.crop_name,
      category: form.category,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      harvest_date: form.harvest_date,
      price_per_unit: parseFloat(form.price_per_unit),
      quality_grade: form.quality_grade,
      certifications,
      photo_urls: photoUrls,
      description: form.description,
      status: 'available',
    }).select().single();

    if (error) {
      setLoading(false);
      toast(`Failed to create batch: ${error.message}`, 'error');
      return;
    }

    // Add supply chain events
    const farmerName = (await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()).data?.full_name ?? 'Farmer';
    const { data: farmerProfile } = await supabase.from('farmer_profiles').select('location').eq('user_id', user.id).maybeSingle();
    const location = farmerProfile?.location ?? 'India';

    await supabase.from('supply_chain_events').insert([
      { batch_id: batch.id, event_type: 'created', actor: farmerName, location, notes: `Batch ${batchCode} listed on FarmTrace.`, created_at: new Date().toISOString() },
      { batch_id: batch.id, event_type: 'harvested', actor: farmerName, location, notes: `Harvested ${form.quantity} ${form.unit} of ${form.crop_name}.`, created_at: new Date(form.harvest_date + 'T09:00:00').toISOString() },
      { batch_id: batch.id, event_type: 'quality_checked', actor: farmerName, location, notes: `Quality grade ${form.quality_grade} assigned.${certifications.length ? ` Certifications: ${certifications.join(', ')}.` : ''}`, created_at: new Date(form.harvest_date + 'T10:00:00').toISOString() },
    ]);

    // Anchor to blockchain (mock)
    await anchorBatchToChain(batch.id);

    setLoading(false);
    setCreatedBatchCode(batchCode);
    toast('Batch created and anchored on blockchain!', 'success');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-earth-950/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        >
          {createdBatchCode ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-600">
                <Sprout className="h-7 w-7" />
              </div>
              <h2 className="font-display text-xl font-bold text-earth-950">Batch Created Successfully!</h2>
              <p className="mt-1 text-sm text-earth-600">Your batch has been anchored on the Polygon blockchain.</p>
              <div className="mt-6 flex justify-center">
                <QrCodeDisplay batchCode={createdBatchCode} />
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={onCreated} className="btn-primary flex-1">Done</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between border-b border-earth-100 px-6 py-4">
                <h2 className="font-display text-lg font-bold text-earth-950">Add Produce Batch</h2>
                <button onClick={onClose} className="text-earth-400 hover:text-earth-700"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div>
                  <label className="label">Crop Name *</label>
                  <input list="crops" value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} className="input" placeholder="e.g. Tomato" />
                  <datalist id="crops">{CROP_SUGGESTIONS.map(c => <option key={c} value={c} />)}</datalist>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Category *</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Quality Grade *</label>
                    <select value={form.quality_grade} onChange={(e) => setForm({ ...form, quality_grade: e.target.value })} className="input">
                      {QUALITY_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Quantity *</label>
                    <input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input" placeholder="500" />
                  </div>
                  <div>
                    <label className="label">Unit *</label>
                    <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input">
                      <option value="kg">kg</option>
                      <option value="quintal">quintal</option>
                      <option value="ton">ton</option>
                      <option value="dozen">dozen</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Price/unit * (₹)</label>
                    <input type="number" step="0.01" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })} className="input" placeholder="28" />
                  </div>
                </div>

                <div>
                  <label className="label">Harvest Date *</label>
                  <input type="date" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} className="input" />
                </div>

                <div>
                  <label className="label">Certifications</label>
                  <div className="flex flex-wrap gap-2">
                    {CERTIFICATIONS.map(c => (
                      <button key={c} type="button" onClick={() => toggleCert(c)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${certifications.includes(c) ? 'bg-primary-600 text-white' : 'bg-earth-100 text-earth-700 hover:bg-earth-200'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" placeholder="Describe your produce — variety, growing conditions, etc." />
                </div>

                <div>
                  <label className="label">Photos</label>
                  <div className="flex flex-wrap gap-3">
                    {photoUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                        <button type="button" onClick={() => setPhotoUrls(photoUrls.filter((_, j) => j !== i))}
                          className="absolute -right-1 -top-1 rounded-full bg-error-600 p-0.5 text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-earth-200 text-earth-400 hover:border-primary-400 hover:text-primary-500">
                      {uploading ? <LoadingSpinner size="sm" /> : <><Upload className="h-5 w-5" /><span className="text-xs">Upload</span></>}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
                    </label>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <LoadingSpinner size="sm" /> : <>Create Batch & Generate QR</>}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
