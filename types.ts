
export enum CategoryType {
  NATIVE = 'Native Type',
  SUBSCRIPTION = 'Subscription Type',
  COURSE = 'Course Type'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: CategoryType;
  description: string;
  imageUrl: string;
  fileUrl?: string;
}

export interface User {
  username: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
  fullName?: string;
  avatarUrl?: string;
}

export interface Visit {
  id: string;
  user_id: string;
  created_at: string;
  username?: string;
  session_id: string;
  page: string;
  ip_address?: string;
}

export interface Order {
  id: string;
  user_id: string;
  created_at: string;
  customer_username: string;
  amount: number;
  items: any[];
  status: string;
}

export interface Customer {
  username: string;
  total_spent: number;
  order_count: number;
  last_visit?: string;
  visit_count: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export type LeadReason = 'general' | 'support' | 'billing' | 'partnership' | 'feedback';

export interface Lead {
  id: string;
  user_id: string;
  created_at: string;
  username?: string;
  email?: string;
  reason: LeadReason;
  message: string;
  status: 'new' | 'contacted' | 'resolved';
}
