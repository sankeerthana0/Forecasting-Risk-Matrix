/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RawTransaction {
  id: string;
  date: string;
  amount: number;
  customerId: string;
  productId: string;
  country: string;
  paymentMethod: string;
  discountApplied: number; // percentage
  status: 'completed' | 'pending' | 'failed' | 'disputed';
}

export interface CustomerProfile {
  id: string;
  name: string;
  tier: 'Enterprise' | 'Mid-Market' | 'SMB';
  industry: string;
}

export interface ProductCatalog {
  id: string;
  name: string;
  category: 'Software License' | 'Professional Services' | 'SaaS Subscription' | 'Hardware API';
  unitPrice: number;
}

export interface EtlRow {
  transaction_id: string;
  date: string;
  customer_name: string;
  customer_tier: string;
  industry: string;
  product_name: string;
  category: string;
  raw_amount: number;
  discount_pct: number;
  final_revenue: number;
  status: string;
  is_valid: boolean;
  validation_errors: string[];
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  forecast?: number;
  lowerBound?: number;
  upperBound?: number;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface RiskEvent {
  id: string;
  title: string;
  impactType: 'negative' | 'positive';
  category: 'Market' | 'Operational' | 'Financial' | 'Regulatory';
  description: string;
  affectedPercentage: number; // e.g. -15 for churn
  active: boolean;
}

export interface AnomalyReport {
  id: string;
  title: string;
  date: string;
  severity: 'high' | 'medium' | 'low';
  category: 'Spike' | 'Drop' | 'Mismatch' | 'Outlier';
  description: string;
  sqlAuditQuery: string;
  status: 'unresolved' | 'accepted' | 'ignored';
}

export interface QueryPreset {
  id: string;
  title: string;
  sql: string;
  description: string;
}
