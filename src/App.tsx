/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { initialRiskEvents, initialAnomalyReports, rawTransactions } from './data/mockData';
import { ForecastPoint, RiskEvent, AnomalyReport } from './types';
import { ForecastResult } from './utils/pythonForecaster';
import SqlEtlSection from './components/SqlEtlSection';
import PythonForecastSection from './components/PythonForecastSection';
import PowerBiSection from './components/PowerBiSection';
import { Layers, Cpu, BarChart3, HelpCircle, ArrowRight, ShieldAlert, BadgeInfo, CheckCircle2, ChevronDown, ListFilter, AlertCircle, RefreshCw, Star, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  // Centralized State Management
  const [forecastPoints, setForecastPoints] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sqlValidationAccuracy, setSqlValidationAccuracy] = useState<number>(95.8);
  const [totalProcessedCount, setTotalProcessedCount] = useState<number>(rawTransactions.length);
  const [isAnomalyAdjusted, setIsAnomalyAdjusted] = useState<boolean>(true);
  const [availableRisks, setAvailableRisks] = useState<RiskEvent[]>(initialRiskEvents);
  const [anomalyReports, setAnomalyReports] = useState<AnomalyReport[]>(initialAnomalyReports);
  const [predictedRunRate, setPredictedRunRate] = useState<number>(0);
  const [riskAdjustedShortfall, setRiskAdjustedShortfall] = useState<number>(0);

  // Database Sync status
  const [etlDatabaseRefreshed, setEtlDatabaseRefreshed] = useState<boolean>(false);

  // Handlers
  const handlePipelineRun = (accuracy: number, totalProcessed: number) => {
    setSqlValidationAccuracy(accuracy);
    setTotalProcessedCount(totalProcessed);
    
    // Trigger rapid visual sync highlight
    setEtlDatabaseRefreshed(true);
    setTimeout(() => setEtlDatabaseRefreshed(false), 2500);
  };

  const handleForecastTrain = (
    result: ForecastResult, 
    activeRisks: RiskEvent[], 
    isAnomalyFiltered: boolean
  ) => {
    setLoading(true);
    setForecastPoints(result.points);
    setPredictedRunRate(result.metrics.predictedRunRate);
    setRiskAdjustedShortfall(result.metrics.riskAdjustedShortfall);
    setIsAnomalyAdjusted(isAnomalyFiltered);
    setLoading(false);
  };

  const handleToggleRisk = (id: string) => {
    setAvailableRisks(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleResolveAnomaly = (id: string, status: 'accepted' | 'ignored') => {
    setAnomalyReports(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    
    // If we apply outlier median weighting to check the high outlier spike,
    // we communicate it to the Python engine by automatically forcing isAnomalyAdjusted to True
    if (id === 'an_1' && status === 'accepted') {
      setIsAnomalyAdjusted(true);
      // Visual feedback via a temporary force-update or re-triggering simulation state
      setAvailableRisks(prev => [...prev]); // force reference update
    }
  };

  return (
    <div className="bg-[#E4E3E0] min-h-screen text-[#141414] selection:bg-[#141414] selection:text-white pb-16 font-sans antialiased" id="main-app-container">
      {/* Top Professional Header Bar */}
      <header className="sticky top-0 z-40 bg-[#FAFAF9] border-b-2 border-[#141414] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 border-2 border-[#141414] bg-[#141414] flex items-center justify-center text-white rounded-none">
              <TrendingDown className="w-4 h-4" id="logo-icon" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-serif italic text-gray-950 leading-none tracking-tight">Forecasting & Risk Matrix</h1>
              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block mt-0.5">Python &bull; SQL &bull; Power BI System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* SLA Status Pill */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 border-2 border-[#141414] bg-white text-[#141414] font-mono text-[9px] uppercase font-bold rounded-none">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              <span>Pipeline: ACTIVE SLA</span>
            </div>
            {/* Version Badge */}
            <div className="font-mono text-[9px] font-bold text-slate-700 bg-[#D4D3D0] border-2 border-[#141414] rounded-none px-2 py-0.5">
              SYS_REV_v1.4.2
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Enterprise System Workflow Map Banner */}
        <section className="bg-[#F1EFEC] text-[#141414] border-2 border-[#141414] p-5 rounded-none shadow-[4px_4px_0px_#141414] relative overflow-hidden" id="intro-hero-banner">
          <div className="relative z-10 max-w-4xl">
            <span className="text-[9px] bg-[#141414] text-white font-mono font-bold px-2 py-0.5 rounded-none uppercase tracking-wider inline-block mb-2">
              FINANCIAL ENGINEERING SPECIFICATION
            </span>
            <h2 className="text-lg font-bold font-serif italic text-gray-950 tracking-tight leading-snug">
              Interactive End-to-End Treasury Forecasting Platform
            </h2>
            <p className="text-slate-700 text-[11px] mt-1 leading-relaxed">
              This platform replicates a high-performing Corporate Finance pipeline. It simulates 
              <strong> SQL ETL extraction sanitization</strong>, training customized <strong>Python ARIMA time-series projections</strong>, 
              and presenting structured metrics inside an interactive <strong>Power BI-style workspace</strong>. Use the tools below to alter constraints and analyze risk proactively.
            </p>
          </div>

          {/* Workflow Interactive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-dashed border-[#141414]" id="workflow-cards">
            {/* Step 1 Card */}
            <div className="flex items-start gap-2.5 p-3 rounded-none bg-white border-2 border-[#141414] hover:shadow-[3px_3px_0px_#141414] transition-all">
              <div className="w-6 h-6 bg-[#141414] text-white font-mono font-bold flex items-center justify-center text-xs flex-shrink-0 rounded-none">
                01
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1 font-mono uppercase tracking-tight">
                  <Layers className="w-3.5 h-3.5 text-[#141414]" /> PostgreSQL ETL
                </span>
                <p className="text-[10px] text-gray-600 leading-normal mt-0.5">
                  Extracts POS postings. Joins customer dimensions, checks integrity constraints, and filters noise for {sqlValidationAccuracy}% data accuracy.
                </p>
              </div>
            </div>

            {/* Step 2 Card */}
            <div className="flex items-start gap-2.5 p-3 rounded-none bg-white border-2 border-[#141414] hover:shadow-[3px_3px_0px_#141414] transition-all">
              <div className="w-6 h-6 bg-[#141414] text-white font-mono font-bold flex items-center justify-center text-xs flex-shrink-0 rounded-none">
                02
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1 font-mono uppercase tracking-tight">
                  <Cpu className="w-3.5 h-3.5 text-[#141414]" /> Python Engine
                </span>
                <p className="text-[10px] text-gray-600 leading-normal mt-0.5">
                  Fits predictive regression & seasonal matrices. Simulates active churn risks or positive demand expansions directly onto target timelines.
                </p>
              </div>
            </div>

            {/* Step 3 Card */}
            <div className="flex items-start gap-2.5 p-3 rounded-none bg-white border-2 border-[#141414] hover:shadow-[3px_3px_0px_#141414] transition-all">
              <div className="w-6 h-6 bg-[#141414] text-white font-mono font-bold flex items-center justify-center text-xs flex-shrink-0 rounded-none">
                03
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1 font-mono uppercase tracking-tight">
                  <BarChart3 className="w-3.5 h-3.5 text-[#141414]" /> Power BI Output
                </span>
                <p className="text-[10px] text-gray-600 leading-normal mt-0.5">
                  Consolidates portfolios. Allows interactive filtering by product categories and reviews proactive audits on outlier transaction risks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: SQL ETL Parser Block */}
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 border-b border-[#141414] pb-1">
            <span className="text-[#141414] font-bold font-mono text-[10px] uppercase tracking-wider">STAGE 01 &mdash; Ledger Synchronization</span>
          </div>
          <SqlEtlSection 
            onPipelineRun={handlePipelineRun} 
            etlDatabaseRefreshed={etlDatabaseRefreshed}
          />
        </section>

        {/* Section 2: Python Forecasting Model Control Block */}
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 border-b border-[#141414] pb-1">
            <span className="text-[#141414] font-bold font-mono text-[10px] uppercase tracking-wider">STAGE 02 &mdash; Regression &amp; Solver Sandbox</span>
          </div>
          <PythonForecastSection 
            onForecastTrain={handleForecastTrain}
            availableRisks={availableRisks}
            onToggleRisk={handleToggleRisk}
          />
        </section>

        {/* Section 3: Power BI Executive Dashboard Block (Main Embedded Portal representation) */}
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 border-b border-[#141414] pb-1">
            <span className="text-[#141414] font-bold font-mono text-[10px] uppercase tracking-wider">STAGE 03 &mdash; BI Workspace Reporting</span>
          </div>
          <PowerBiSection 
            forecastPoints={forecastPoints}
            loading={loading}
            sqlValidationAccuracy={sqlValidationAccuracy}
            activeRisks={availableRisks}
            anomalyReports={anomalyReports}
            isAnomalyAdjusted={isAnomalyAdjusted}
            onResolveAnomaly={handleResolveAnomaly}
            predictedRunRate={predictedRunRate}
            riskAdjustedShortfall={riskAdjustedShortfall}
          />
        </section>

        {/* Proactive Risk & Manual Intervention summary */}
        <section className="bg-white border-2 border-[#141414] rounded-none p-5 flex flex-col md:flex-row gap-4 items-start shadow-[4px_4px_0px_#141414]" id="summary-advisory-note">
          <div className="bg-[#FAFAF9] border-2 border-[#141414] p-2 rounded-none flex-shrink-0">
            <ShieldAlert className="w-6 h-6 text-[#141414]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-900">Active Financial Engineering Highlights</h4>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              This end-to-end system achieves complete automated synergy. Running specific queries inside the 
              <strong> PostgreSQL ETL Console</strong> updates the database state; altering 
              <strong> Python ARIMA variables</strong> propagates coefficient shifts instantly; and resolving outliers inside 
              <strong> Power BI's audit log</strong> flattens trend lines and returns data accuracy back above the threshold SLA. 
              Review the charts in real-time by selecting different dimensional slices from the Power BI rail filters.
            </p>
          </div>
        </section>

      </main>

      {/* Corporate footer */}
      <footer className="mt-16 border-t-2 border-[#141414] bg-[#F1EFEC] py-6 text-center text-[11px] text-slate-700 font-mono">
        <p>&copy; 2026 Executive Reporting Suite. Connected to S3 warehouse bucket.</p>
        <p className="mt-1">All forecasting calculations are model-converged under OLS & ARIMA equations.</p>
      </footer>
    </div>
  );
}
