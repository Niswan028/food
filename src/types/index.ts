export type UserRole = 'farmer' | 'buyer' | 'admin';

export type BatchStatus = 'available' | 'reserved' | 'sold' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type EventType = 'created' | 'harvested' | 'quality_checked' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface FarmerProfile {
  id: string;
  user_id: string;
  farm_name: string;
  location: string;
  state: string;
  farm_size_acres: number | null;
  crops_grown: string[];
  certifications: string[];
  verification_status: VerificationStatus;
  document_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface ProduceBatch {
  id: string;
  batch_code: string;
  farmer_id: string;
  crop_name: string;
  category: string;
  quantity: number;
  unit: string;
  harvest_date: string;
  price_per_unit: number;
  quality_grade: string;
  certifications: string[];
  photo_urls: string[];
  description: string | null;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
}

export interface SupplyChainEvent {
  id: string;
  batch_id: string;
  event_type: EventType;
  actor: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_address: string;
  shipping_state: string | null;
  buyer_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  batch_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  buyer_id: string;
}

export interface Payment {
  id: string;
  order_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;
  status: PaymentStatus;
  method: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  batch_id: string;
  farmer_id: string;
  buyer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface BlockchainAnchor {
  id: string;
  batch_id: string;
  tx_hash: string;
  block_number: number;
  network: string;
  anchored_at: string;
}

export interface BatchWithFarmer extends ProduceBatch {
  farmer_profiles: FarmerProfile | null;
  profiles: Profile | null;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { produce_batches: ProduceBatch })[];
  buyer_profile?: Profile | null;
}
