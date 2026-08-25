export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function generateBatchCode(farmerIndex: number, batchCount: number): string {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `FT-${String(farmerIndex + 1).padStart(2, '0')}-${String(batchCount + 1).padStart(3, '0')}-${timestamp}`;
}

export function getTraceUrl(batchCode: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/trace/${batchCode}`;
}

export const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Spices', 'Nuts'];

export const QUALITY_GRADES = ['A+', 'A', 'B', 'C'];

export const CERTIFICATIONS = ['Organic', 'FSSAI', 'APEDA', 'Spice Board', 'GAP', 'ISO 22000'];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export const CROP_SUGGESTIONS = [
  'Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Basmati Rice', 'Mustard',
  'Mango', 'Banana', 'Apple', 'Cherry', 'Walnut', 'Black Pepper', 'Cardamom',
  'Coconut', 'Groundnut', 'Soybean', 'Maize', 'Garlic', 'Spinach', 'Coriander',
  'Cabbage', 'Chilli', 'Ginger', 'Turmeric', 'Cotton', 'Sugarcane',
];
