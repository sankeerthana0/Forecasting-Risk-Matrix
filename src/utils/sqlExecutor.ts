/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RawTransaction, CustomerProfile, ProductCatalog, EtlRow } from '../types';
import { rawTransactions, customerProfiles, productCatalog } from '../data/mockData';

export interface SqlResult {
  columns: string[];
  rows: any[];
  accuracyMetric: number;
  totalCount: number;
  validCount: number;
  invalidCount: number;
  summary: string;
}

export function executeSimulationQuery(sql: string): SqlResult {
  const normalizedSql = sql.toLowerCase().replace(/\s+/g, ' ');

  // 1. Determine which of the queries is being run, or do a simplified runtime parser
  if (normalizedSql.includes('group by c.tier') || normalizedSql.includes('by customer_tier')) {
    // Stage 3: Aggregations by Client Tier
    const completedTx = rawTransactions.filter(t => t.status === 'completed' && t.amount > 0);
    const tierGroups: Record<string, { count: number; gross: number; net: number; sumDiscounts: number }> = {};

    completedTx.forEach(t => {
      const cust = customerProfiles.find(c => c.id === t.customerId);
      const tier = cust ? cust.tier : 'SMB';
      
      const discountVal = t.discountApplied;
      const net = t.amount * (1 - discountVal / 100);

      if (!tierGroups[tier]) {
        tierGroups[tier] = { count: 0, gross: 0, net: 0, sumDiscounts: 0 };
      }
      tierGroups[tier].count += 1;
      tierGroups[tier].gross += t.amount;
      tierGroups[tier].net += net;
      tierGroups[tier].sumDiscounts += discountVal;
    });

    const rows = Object.entries(tierGroups).map(([tier, stat]) => ({
      customer_tier: tier,
      deal_volume: stat.count,
      total_gross_rev: Math.round(stat.gross),
      total_net_rev: Math.round(stat.net),
      avg_concession_discount: parseFloat((stat.sumDiscounts / stat.count).toFixed(1)) + '%'
    }));

    return {
      columns: ['customer_tier', 'deal_volume', 'total_gross_rev', 'total_net_rev', 'avg_concession_discount'],
      rows,
      accuracyMetric: 100, // Summarization is on clean records
      totalCount: completedTx.length,
      validCount: completedTx.length,
      invalidCount: 0,
      summary: 'Aggregated transactional data summarized by Enterprise, Mid-Market, and SMB tiers. Provides baseline data streams loaded directly to Executive dashboards.'
    };
  }

  if (normalizedSql.includes('integrity constraints') || normalizedSql.includes('data_validation_result') || normalizedSql.includes('case when')) {
    // Stage 2: Audit checks & Data Validation
    const rows = rawTransactions.map(t => {
      let result = 'VALID';
      let errorDesc = '';

      if (t.amount < 0) {
        result = 'REJECTED: NEGATIVE AMOUNT';
        errorDesc = 'Financial integrity violation. Negative invoice volume.';
      } else if (t.status === 'failed') {
        result = 'REJECTED: FAILED STATUS';
        errorDesc = 'Bank ACH payment failure. Revenue reversed.';
      } else if (t.id === 'UNKNOWN' || !t.customerId) {
        result = 'WARN: NULL TARGET';
        errorDesc = 'Missing associated customer reference.';
      } else if (t.amount === 0) {
        result = 'WARN: ZERO VALUE CONVENTIONS';
        errorDesc = 'Zero dollar license line audit.';
      } else if (t.status === 'disputed') {
        result = 'AUDIT: DISPUTED TRANSACTION';
        errorDesc = 'Client payment currently disputed.';
      }

      return {
        transaction_id: t.id,
        date: t.date,
        raw_amount: t.amount,
        status: t.status,
        validation_result: result,
        issue_details: errorDesc || 'System integrity check passed.'
      };
    });

    // Count statistics
    const totalCount = rows.length;
    const invalidCount = rows.filter(r => r.validation_result.startsWith('REJECTED')).length;
    const validCount = totalCount - invalidCount;
    const accuracyMetric = parseFloat(((validCount / totalCount) * 100).toFixed(1));

    return {
      columns: ['transaction_id', 'date', 'raw_amount', 'status', 'validation_result', 'issue_details'],
      rows,
      accuracyMetric,
      totalCount,
      validCount,
      invalidCount,
      summary: `SQL ETL pipeline audit completed. Enforced negative and failure filter checks. Validated ${validCount} out of ${totalCount} postings, achieving exactly ${accuracyMetric}% raw financial validation integrity.`
    };
  }

  // DEFAULT OR Stage 1: Extraction & Joining Standard Query
  const processedRows: EtlRow[] = [];
  rawTransactions.forEach(t => {
    const cust = customerProfiles.find(c => c.id === t.customerId);
    const prod = productCatalog.find(p => p.id === t.productId);
    
    const errors: string[] = [];
    let isValid = true;

    if (t.amount < 0) {
      isValid = false;
      errors.push('Negative amount is invalid.');
    }
    if (t.status === 'failed') {
      isValid = false;
      errors.push('Failed collection status.');
    }

    const raw_amount = t.amount;
    const final_revenue = isValid ? raw_amount * (1 - t.discountApplied / 100) : 0;

    processedRows.push({
      transaction_id: t.id,
      date: t.date,
      customer_name: cust ? cust.name : 'Unknown Corp',
      customer_tier: cust ? cust.tier : 'N/A',
      industry: cust ? cust.industry : 'N/A',
      product_name: prod ? prod.name : 'Unknown Service',
      category: prod ? prod.category : 'N/A',
      raw_amount,
      discount_pct: t.discountApplied,
      final_revenue,
      status: t.status,
      is_valid: isValid,
      validation_errors: errors
    });
  });

  const queryFilteredRows = processedRows.filter(r => r.status !== 'failed');

  const totalCount = queryFilteredRows.length;
  const validCount = queryFilteredRows.filter(r => r.is_valid).length;
  const invalidCount = totalCount - validCount;
  const accuracyMetric = parseFloat(((validCount / totalCount) * 100).toFixed(1));

  return {
    columns: ['transaction_id', 'date', 'customer_name', 'customer_tier', 'product_name', 'category', 'raw_amount', 'discount_pct', 'final_revenue'],
    rows: queryFilteredRows.map(r => ({
      transaction_id: r.transaction_id,
      date: r.date,
      customer_name: r.customer_name,
      customer_tier: r.customer_tier,
      product_name: r.product_name,
      category: r.category,
      raw_amount: r.raw_amount,
      discount_pct: r.discount_pct + '%',
      final_revenue: parseFloat(r.final_revenue.toFixed(1))
    })),
    accuracyMetric,
    totalCount,
    validCount,
    invalidCount,
    summary: `Joined raw financial tables using INNER JOIN on customer profiles and product catalogs. Calculated net operational revenue after discounts. Out of ${totalCount} records, ${validCount} passed full verification, securing ${accuracyMetric}% data trust.`
  };
}
