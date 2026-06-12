/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RawTransaction, CustomerProfile, ProductCatalog, RiskEvent, AnomalyReport, QueryPreset } from '../types';

export const customerProfiles: CustomerProfile[] = [
  { id: 'C001', name: 'Acme Corp', tier: 'Enterprise', industry: 'Technology' },
  { id: 'C002', name: 'Stark Industries', tier: 'Enterprise', industry: 'Defense' },
  { id: 'C003', name: 'Wayne Enterprises', tier: 'Enterprise', industry: 'Financials' },
  { id: 'C004', name: 'Globex Corp', tier: 'Mid-Market', industry: 'Energy' },
  { id: 'C005', name: 'Umbrella Holdings', tier: 'Enterprise', industry: 'Healthcare' },
  { id: 'C006', name: 'Initech LLC', tier: 'SMB', industry: 'Technology' },
  { id: 'C007', name: 'Hooli Inc', tier: 'Enterprise', industry: 'Technology' },
  { id: 'C008', name: 'Dunder Mifflin', tier: 'SMB', industry: 'Consumer Goods' },
  { id: 'C009', name: 'Soylent green', tier: 'Mid-Market', industry: 'Healthcare' },
  { id: 'C010', name: 'Tyrell Nexus', tier: 'Enterprise', industry: 'Technology' },
];

export const productCatalog: ProductCatalog[] = [
  { id: 'P001', name: 'SaaS Cloud Sub', category: 'SaaS Subscription', unitPrice: 1200 },
  { id: 'P002', name: 'API Core Gateway', category: 'Hardware API', unitPrice: 3500 },
  { id: 'P003', name: 'Consulting Delivery', category: 'Professional Services', unitPrice: 5000 },
  { id: 'P004', name: 'Enterprise License Node', category: 'Software License', unitPrice: 8500 },
];

export const rawTransactions: RawTransaction[] = [
  // 2026 Monthly Data from Jan to May
  { id: 'TX001', date: '2026-01-05', amount: 15000, customerId: 'C001', productId: 'P001', country: 'US', paymentMethod: 'Wire', discountApplied: 10, status: 'completed' },
  { id: 'TX002', date: '2026-01-12', amount: 8500, customerId: 'C003', productId: 'P004', country: 'UK', paymentMethod: 'ACH', discountApplied: 0, status: 'completed' },
  { id: 'TX003', date: '2026-01-20', amount: -2500, customerId: 'C005', productId: 'P003', country: 'DE', paymentMethod: 'Wire', discountApplied: 5, status: 'completed' }, // Neg (to be marked INVALID)
  
  { id: 'TX004', date: '2026-02-03', amount: 22000, customerId: 'C002', productId: 'P002', country: 'US', paymentMethod: 'Wire', discountApplied: 15, status: 'completed' },
  { id: 'TX005', date: '2026-02-14', amount: 5000, customerId: 'C004', productId: 'P003', country: 'CA', paymentMethod: 'Credit Card', discountApplied: 0, status: 'completed' },
  { id: 'TX006', date: '2026-02-28', amount: 1200, customerId: 'C008', productId: 'P001', country: 'US', paymentMethod: 'Credit Card', discountApplied: 0, status: 'failed' }, // Failed (to be filtered/invalidated)

  { id: 'TX007', date: '2026-03-10', amount: 17500, customerId: 'C007', productId: 'P001', country: 'US', paymentMethod: 'Wire', discountApplied: 5, status: 'completed' },
  { id: 'TX008', date: '2026-03-18', amount: 85000, customerId: 'C001', productId: 'P004', country: 'US', paymentMethod: 'ACH', discountApplied: 12, status: 'completed' }, // Large spike (potential anomaly)
  { id: 'TX009', date: '2026-03-25', amount: 4800, customerId: 'C010', productId: 'P002', country: 'JP', paymentMethod: 'Wire', discountApplied: 0, status: 'disputed' }, // Disputed (warning)

  { id: 'TX010', date: '2026-04-02', amount: 19500, customerId: 'C006', productId: 'P001', country: 'US', paymentMethod: 'Credit Card', discountApplied: 20, status: 'completed' },
  { id: 'TX011', date: '2026-04-15', amount: 10000, customerId: 'C003', productId: 'P003', country: 'UK', paymentMethod: 'Wire', discountApplied: 0, status: 'completed' },
  { id: 'TX012', date: '2026-04-22', amount: 3500, customerId: 'C009', productId: 'P002', country: 'FR', paymentMethod: 'ACH', discountApplied: 2, status: 'completed' },

  { id: 'TX013', date: '2026-05-04', amount: 26000, customerId: 'C004', productId: 'P004', country: 'CA', paymentMethod: 'Wire', discountApplied: 8, status: 'completed' },
  { id: 'TX014', date: '2026-05-15', amount: 14500, customerId: 'C005', productId: 'P001', country: 'DE', paymentMethod: 'Wire', discountApplied: 0, status: 'completed' },
  { id: 'TX015', date: '2026-05-29', amount: 0, customerId: 'C001', productId: 'P003', country: 'US', paymentMethod: 'ACH', discountApplied: 0, status: 'completed' }, // Zero value (warnings)

  // Expanded coverage - older dates to show baseline trend (2025 H2)
  { id: 'TX101', date: '2025-07-15', amount: 14000, customerId: 'C001', productId: 'P001', country: 'US', paymentMethod: 'Wire', discountApplied: 0, status: 'completed' },
  { id: 'TX102', date: '2025-08-11', amount: 13500, customerId: 'C002', productId: 'P001', country: 'US', paymentMethod: 'Wire', discountApplied: 0, status: 'completed' },
  { id: 'TX103', date: '2025-09-18', amount: 16000, customerId: 'C003', productId: 'P004', country: 'UK', paymentMethod: 'ACH', discountApplied: 5, status: 'completed' },
  { id: 'TX104', date: '2025-10-05', amount: 19000, customerId: 'C004', productId: 'P002', country: 'CA', paymentMethod: 'Wire', discountApplied: 10, status: 'completed' },
  { id: 'TX105', date: '2025-11-20', amount: 21000, customerId: 'C005', productId: 'P003', country: 'DE', paymentMethod: 'Wire', discountApplied: 0, status: 'completed' },
  { id: 'TX106', date: '2025-12-15', amount: 24500, customerId: 'C007', productId: 'P001', country: 'US', paymentMethod: 'ACH', discountApplied: 5, status: 'completed' },

  // A couple extra 2026 Q1 and Q2 points to stabilize trend
  { id: 'TX016', date: '2026-01-28', amount: 11000, customerId: 'C002', productId: 'P002', country: 'US', paymentMethod: 'Credit Card', discountApplied: 5, status: 'completed' },
  { id: 'TX017', date: '2026-02-18', amount: 13500, customerId: 'C003', productId: 'P001', country: 'UK', paymentMethod: 'Wire', discountApplied: 0, status: 'completed' },
  { id: 'TX018', date: '2026-03-05', amount: 15000, customerId: 'C006', productId: 'P001', country: 'US', paymentMethod: 'Credit Card', discountApplied: 15, status: 'completed' },
  { id: 'TX019', date: '2026-04-28', amount: 18000, customerId: 'C005', productId: 'P004', country: 'DE', paymentMethod: 'Wire', discountApplied: 0, status: 'completed' },
  { id: 'TX020', date: '2026-05-22', amount: 20000, customerId: 'C010', productId: 'P002', country: 'JP', paymentMethod: 'ACH', discountApplied: 10, status: 'completed' },
];

export const presetQueries: QueryPreset[] = [
  {
    id: 'q1',
    title: 'Standard ETL & Joined Aggregations',
    sql: `/* ETL Pipeline Stage 1: Extraction & Joining */
SELECT 
  t.id AS transaction_id,
  t.date,
  c.name AS customer_name,
  c.tier AS customer_tier,
  c.industry,
  p.name AS product_name,
  p.category,
  t.amount AS raw_amount,
  t.discountApplied AS discount_pct,
  -- Deduct discount to get net transactional revenue
  t.amount * (1 - t.discountApplied / 100.0) AS final_revenue,
  t.status
FROM raw_transactions t
INNER JOIN customer_profiles c ON t.customerId = c.id
INNER JOIN product_catalog p ON t.productId = p.id
WHERE t.status = 'completed';`,
    description: 'Main extraction pipeline. Filters out failed transactions, performs dimensions lookup (Customer & Product), and computes contract discounts.',
  },
  {
    id: 'q2',
    title: 'Financial Quality & Audit Controls',
    sql: `/* ETL Pipeline Stage 2: Data Validation & Cleansing */
SELECT 
  t.id AS transaction_id,
  t.date,
  t.amount AS raw_amount,
  t.status,
  CASE 
    WHEN t.amount < 0 THEN 'REJECTED: NEGATIVE AMOUNT'
    WHEN t.amount IS NULL THEN 'REJECTED: NULL VAL'
    WHEN t.status = 'failed' THEN 'REJECTED: FAILED STATUS'
    WHEN t.status = 'disputed' THEN 'AUDIT: DISPUTED TRANSACTION'
    WHEN t.amount = 0 THEN 'WARN: ZERO VALUE CONVENTIONS'
    ELSE 'VALID'
  END AS data_validation_result
FROM raw_transactions t
ORDER BY t.date DESC;`,
    description: 'Validates integrity constraints. Flagging negative values, failures, nulls, and high-dispute regions to isolate and protect the 95%+ dashboard accuracy threshold.',
  },
  {
    id: 'q3',
    title: 'Revenue Aggregation by Client-Tier',
    sql: `/* Aggregations for Power BI Executive Summaries */
SELECT 
  c.tier AS customer_tier,
  COUNT(t.id) AS deal_volume,
  SUM(t.amount) AS total_gross_rev,
  SUM(t.amount * (1 - t.discountApplied / 100.0)) AS total_net_rev,
  AVG(t.discountApplied) AS avg_concession_discount
FROM raw_transactions t
JOIN customer_profiles c ON t.customerId = c.id
WHERE t.status = 'completed' AND t.amount > 0
GROUP BY c.tier
ORDER BY total_net_rev DESC;`,
    description: 'Summarizes portfolio segments to optimize visual charts in the Power BI portal, showing which tiers contribute most to ARR/MRR cashflows.',
  }
];

export const initialRiskEvents: RiskEvent[] = [
  {
    id: 'risk_1',
    title: 'Premium Churn Vulnerability',
    category: 'Financial',
    impactType: 'negative',
    description: 'Unfavorable renewals in Tier-1 Enterprise accounts resulting in customer downsizing.',
    affectedPercentage: -14,
    active: false,
  },
  {
    id: 'risk_2',
    title: 'SaaS Core API Scaling Success',
    category: 'Market',
    impactType: 'positive',
    description: 'Unplanned API deployment expansion leading to high SaaS product demand bumps.',
    affectedPercentage: 11,
    active: false,
  },
  {
    id: 'risk_3',
    title: 'Regulatory Change / Tax Rate Adjustment',
    category: 'Regulatory',
    impactType: 'negative',
    description: 'Compliance adjustments in EU territories introducing dynamic currency drag.',
    affectedPercentage: -5,
    active: false,
  },
  {
    id: 'risk_4',
    title: 'Supply Chain Component Squeeze',
    category: 'Operational',
    impactType: 'negative',
    description: 'Slowing hardware deployment capacity for physical nodes, shifting delivery metrics back.',
    affectedPercentage: -8,
    active: false,
  },
];

export const initialAnomalyReports: AnomalyReport[] = [
  {
    id: 'an_1',
    title: 'Acme Corp Outlier Spike',
    date: '2026-03-18',
    severity: 'high',
    category: 'Spike',
    description: 'A transaction amount of $85,000 was loaded, which is 5.4x standard deviation above standard enterprise transactions.',
    sqlAuditQuery: "SELECT * FROM raw_transactions WHERE id = 'TX008';",
    status: 'unresolved'
  },
  {
    id: 'an_2',
    title: 'Negative Cash Flow Entry',
    date: '2026-01-20',
    severity: 'high',
    category: 'Mismatch',
    description: 'Transaction value entered as -$2,500. Violated baseline audit schema constraint: amounts must be non-negative.',
    sqlAuditQuery: "SELECT * FROM raw_transactions WHERE amount < 0;",
    status: 'unresolved'
  },
  {
    id: 'an_3',
    title: 'Disputed Transaction Flow',
    date: '2026-03-25',
    severity: 'medium',
    category: 'Outlier',
    description: 'Transaction of $4,800 is disputed. Risk of chargeback or adjustment not factored in net forecast algorithms.',
    sqlAuditQuery: "SELECT * FROM raw_transactions WHERE status = 'disputed';",
    status: 'unresolved'
  }
];
