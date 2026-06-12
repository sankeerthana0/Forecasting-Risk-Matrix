/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ForecastPoint, RiskEvent, AnomalyReport } from '../types';
import { AreaChart, AlertOctagon, TrendingUp, Filter, Share2, FileDown, Layers, CheckCircle2, ShieldAlert, BarChart3, Database, ChevronRight, HelpCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface PowerBiSectionProps {
  forecastPoints: ForecastPoint[];
  loading: boolean;
  sqlValidationAccuracy: number;
  activeRisks: RiskEvent[];
  anomalyReports: AnomalyReport[];
  isAnomalyAdjusted: boolean;
  onResolveAnomaly: (id: string, status: 'accepted' | 'ignored') => void;
  predictedRunRate: number;
  riskAdjustedShortfall: number;
}

export default function PowerBiSection({
  forecastPoints,
  loading,
  sqlValidationAccuracy,
  activeRisks,
  anomalyReports,
  isAnomalyAdjusted,
  onResolveAnomaly,
  predictedRunRate,
  riskAdjustedShortfall
}: PowerBiSectionProps) {
  // Page selected sub-tab inside Power BI
  const [activeReportPage, setActiveReportPage] = useState<'executive' | 'anomalies_audits'>('executive');
  
  // Local dimensions filters inside the report
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [showConfidenceBands, setShowConfidenceBands] = useState<boolean>(true);
  
  // Selected anomaly raw query audit visual modal/subpane
  const [inspectedAnomalyId, setInspectedAnomalyId] = useState<string | null>('an_1');

  // Math calculated metrics from inputs
  const actualsList = forecastPoints.filter(p => p.actual !== undefined);
  const totalActualRevenue = actualsList.reduce((sum, p) => sum + (p.actual || 0), 0);
  const forecastedList = forecastPoints.filter(p => p.forecast !== undefined);
  const totalForecastingProjections = forecastedList.reduce((sum, p) => sum + (p.forecast || 0), 0);

  // Filter list of data points to represent local industry filters (Interactive Drilldown Simulation!)
  // In a real Power BI, selecting filters alters the curves slightly.
  // We simulate dimension reduction coefficient:
  let industryFactor = 1.0;
  if (selectedIndustry === 'Technology') industryFactor = 0.42;
  else if (selectedIndustry === 'Healthcare') industryFactor = 0.18;
  else if (selectedIndustry === 'Energy') industryFactor = 0.15;
  else if (selectedIndustry === 'Financials') industryFactor = 0.25;

  let tierFactor = 1.0;
  if (selectedTier === 'Enterprise') tierFactor = 0.65;
  else if (selectedTier === 'Mid-Market') tierFactor = 0.22;
  else if (selectedTier === 'SMB') tierFactor = 0.13;

  const totalScalingFactor = industryFactor * tierFactor;

  // Custom SVG chart points generator
  // We need to scale our SVG to fit the viewport.
  // Width: 1000px, Height: 300px
  const paddingX = 70;
  const paddingY = 30;
  const chartWidth = 900;
  const chartHeight = 240;

  // Find scale bounds
  const pointsToRender = forecastPoints.map(p => ({
    ...p,
    actual: p.actual !== undefined ? Math.round(p.actual * totalScalingFactor) : undefined,
    forecast: p.forecast !== undefined ? Math.round(p.forecast * totalScalingFactor) : undefined,
    lowerBound: p.lowerBound !== undefined ? Math.round(p.lowerBound * totalScalingFactor) : undefined,
    upperBound: p.upperBound !== undefined ? Math.round(p.upperBound * totalScalingFactor) : undefined,
  }));

  const maxVal = Math.max(
    ...pointsToRender.map(p => Math.max(p.actual || 0, p.forecast || 0, p.upperBound || 0))
  ) * 1.15 || 100000;

  const minVal = 0;

  const getSvgCoordinates = (index: number, val: number) => {
    const totalPoints = pointsToRender.length;
    const x = paddingX + (index / (totalPoints - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight + paddingY - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y };
  };

  // Generate path string for confidence bands (filled path envelope)
  const generateConfidenceEnvelopePath = () => {
    let topPath = '';
    let bottomPath = '';
    
    pointsToRender.forEach((p, idx) => {
      if (p.forecast !== undefined && p.lowerBound !== undefined && p.upperBound !== undefined) {
        const topCoord = getSvgCoordinates(idx, p.upperBound);
        const botCoord = getSvgCoordinates(idx, p.lowerBound);

        if (topPath === '') {
          topPath = `M ${topCoord.x} ${topCoord.y}`;
          bottomPath = `L ${botCoord.x} ${botCoord.y}`;
        } else {
          topPath += ` L ${topCoord.x} ${topCoord.y}`;
          bottomPath = ` L ${botCoord.x} ${botCoord.y}` + bottomPath; // append reverse
        }
      }
    });

    return topPath && bottomPath ? `${topPath} ${bottomPath} Z` : '';
  };

  // Generate path string for actuals line
  const generateActualsLinePath = () => {
    let path = '';
    pointsToRender.forEach((p, idx) => {
      if (p.actual !== undefined) {
        const coord = getSvgCoordinates(idx, p.actual);
        if (path === '') {
          path = `M ${coord.x} ${coord.y}`;
        } else {
          path += ` L ${coord.x} ${coord.y}`;
        }
      }
    });
    return path;
  };

  // Generate path string for forecast line
  const generateForecastLinePath = () => {
    let path = '';
    let isFirst = true;

    // Join actuals transition point to forecast
    const lastActualIdx = pointsToRender.findIndex(p => p.actual !== undefined && pointsToRender[pointsToRender.indexOf(p) + 1]?.forecast !== undefined);
    if (lastActualIdx !== -1) {
      const p = pointsToRender[lastActualIdx];
      const coord = getSvgCoordinates(lastActualIdx, p.actual || 0);
      path = `M ${coord.x} ${coord.y}`;
      isFirst = false;
    }

    pointsToRender.forEach((p, idx) => {
      if (p.forecast !== undefined) {
        const coord = getSvgCoordinates(idx, p.forecast);
        if (isFirst) {
          path = `M ${coord.x} ${coord.y}`;
          isFirst = false;
        } else {
          path += ` L ${coord.x} ${coord.y}`;
        }
      }
    });
    return path;
  };

  const selectedAnomaly = anomalyReports.find(a => a.id === inspectedAnomalyId);

  return (
    <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none shadow-[4px_4px_0px_#141414] overflow-hidden flex flex-col" id="power-bi-section">
      {/* Power BI Workspace Header banner */}
      <div className="bg-[#141414] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#141414]">
        <div className="flex items-center gap-3">
          {/* Simulated Power BI Icon */}
          <div className="w-8 h-8 rounded-none bg-[#f2c811] flex items-center justify-center font-black text-black text-xs border border-black select-none">
            PB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#f2c811] font-mono uppercase tracking-wider">MICROSOFT POWER BI CORE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] text-gray-400 font-mono">CONNECTION: ACTIVE</span>
            </div>
            <h1 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5 leading-snug">
              Finance Workspace &mdash; Revenue Foresight &amp; Risk Matrix
            </h1>
          </div>
        </div>
        
        {/* Quick export actions */}
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-gray-600 hover:bg-neutral-850 text-gray-200 rounded-none font-bold font-mono uppercase transition-all">
            <Share2 className="w-3 h-3" /> SHARE
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-[#f2c811] text-black hover:bg-yellow-500 rounded-none font-extrabold font-mono uppercase transition-all">
            <FileDown className="w-3" /> EXPORT_PDF
          </button>
        </div>
      </div>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        {/* Left Side Rail: Report pages navigation */}
        <div className="md:col-span-2 bg-[#FAFAF9] border-r-2 border-[#141414] text-[#141414] p-3 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1 block mb-2 font-mono">WORKSPACE PAGES</span>
              <ul className="space-y-1.5 font-mono" id="powerbi-pages">
                <li>
                  <button
                    onClick={() => setActiveReportPage('executive')}
                    className={`w-full text-left font-bold text-xs px-2.5 py-1.5 rounded-none flex items-center gap-2 transition-all border-2 ${
                      activeReportPage === 'executive'
                        ? 'bg-[#141414] text-white border-[#141414] shadow-[1.5px_1.5px_0px_#141414]'
                        : 'text-[#141414] border-transparent hover:bg-[#E4E3E0] hover:border-[#141414]'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    EXECUTIVE CURVE
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveReportPage('anomalies_audits')}
                    className={`w-full text-left font-bold text-xs px-2.5 py-1.5 rounded-none flex items-center gap-2 transition-all border-2 ${
                      activeReportPage === 'anomalies_audits'
                        ? 'bg-[#141414] text-white border-[#141414] shadow-[1.5px_1.5px_0px_#141414]'
                        : 'text-[#141414] border-transparent hover:bg-[#E4E3E0] hover:border-[#141414]'
                    }`}
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    SQL OUTLIERS
                    {anomalyReports.filter(a => a.status === 'unresolved').length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-650 ml-auto animate-ping"></span>
                    )}
                  </button>
                </li>
              </ul>
            </div>

            {/* Quick Slices / Dimension Filters Card (Dynamic Sidebar Filter) */}
            <div className="border-t-2 border-[#141414] pt-3.5">
              <span className="text-[10px] font-bold text-[#141414] uppercase tracking-widest block mb-2 flex items-center gap-1 font-mono">
                <Filter className="w-3 h-3" /> DIMENSION SLICERS
              </span>

              {/* Industry Slicer */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-[9px] font-bold uppercase font-mono text-gray-500 block mb-0.5">Industry Sector</label>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="w-full bg-white border-2 border-[#141414] text-xs px-2 py-1 rounded-none text-black font-semibold font-mono focus:outline-none focus:bg-[#FFF]"
                    id="industry-filter-select"
                  >
                    <option value="All">All Industries</option>
                    <option value="Technology">Technology (42%)</option>
                    <option value="Healthcare">Healthcare (18%)</option>
                    <option value="Energy">Energy (15%)</option>
                    <option value="Financials">Financials (25%)</option>
                  </select>
                </div>

                {/* Tier Slicer */}
                <div>
                  <label className="text-[9px] font-bold uppercase font-mono text-gray-500 block mb-0.5">Corporate Client Tier</label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full bg-white border-2 border-[#141414] text-xs px-2 py-1 rounded-none text-black font-semibold font-mono focus:outline-none focus:bg-[#FFF]"
                    id="tier-filter-select"
                  >
                    <option value="All">All Tiers</option>
                    <option value="Enterprise">Enterprise (65%)</option>
                    <option value="Mid-Market">Mid-Market (22%)</option>
                    <option value="SMB">SMB (13%)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Connection status footer in left rail */}
          <div className="border-t-2 border-[#141414] pt-2.5 flex flex-col gap-0.5" id="bi-rail-footer">
            <span className="text-[9px] text-[#141414] uppercase font-mono font-bold">SOURCE:</span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-gray-600 font-semibold">
              <Database className="w-3 h-3 text-slate-800" />
              <span>SQL WAREHOUSE SINK</span>
            </div>
          </div>
        </div>

        {/* Right Main Area: Content of corresponding selected page */}
        <div className="md:col-span-10 bg-white p-4 flex flex-col justify-between">
          {activeReportPage === 'executive' && (
            <div className="space-y-4">
              {/* Executive summary tiles block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" id="bi-kpi-grid">
                {/* Visual KPI: Validated Actual Volume */}
                <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-3 shadow-[3px_3px_0px_#141414] relative overflow-hidden">
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-mono mb-0.5">Raw Actuals Ingested</div>
                  <div className="text-lg font-bold text-gray-950 font-mono tracking-tight">
                    ${Math.round(totalActualRevenue * totalScalingFactor).toLocaleString()}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[9px] text-gray-500 border-t border-gray-200 pt-1 font-mono uppercase font-bold">
                    <span>baseline historical</span>
                    <span className="text-emerald-700 font-bold">11 months</span>
                  </div>
                  <div className="absolute top-0 right-0 w-1 bg-blue-500 h-full"></div>
                </div>

                {/* Visual KPI: Run Rate Projected */}
                <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-3 shadow-[3px_3px_0px_#141414] relative overflow-hidden">
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-mono mb-0.5">Predicted ARR Runway</div>
                  <div className="text-lg font-bold text-gray-950 font-mono tracking-tight">
                    ${Math.round(predictedRunRate * totalScalingFactor).toLocaleString()}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[9px] text-gray-500 border-t border-gray-200 pt-1 font-mono uppercase font-bold">
                    <span>mean predicted runway</span>
                    <span className="text-blue-700 font-bold">1 Year Curve</span>
                  </div>
                  <div className="absolute top-0 right-0 w-1 bg-violet-600 h-full"></div>
                </div>

                {/* Visual KPI: Risk Shortfall Index */}
                <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-3 shadow-[3px_3px_0px_#141414] relative overflow-hidden">
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-mono mb-0.5">Proactive Shortfall</div>
                  <div className={`text-lg font-bold font-mono tracking-tight ${riskAdjustedShortfall > 0 ? 'text-[#b91c1c]' : 'text-emerald-700'}`}>
                    ${Math.round(riskAdjustedShortfall * totalScalingFactor).toLocaleString()}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[9px] text-gray-500 border-t border-gray-200 pt-1 font-mono uppercase font-bold">
                    <span>forecast variation risk</span>
                    <span className={`font-bold ${riskAdjustedShortfall > 0 ? 'text-[#b91c1c]' : 'text-emerald-700'}`}>
                      {riskAdjustedShortfall > 0 ? 'Risks Active' : 'Low Vulnerability'}
                    </span>
                  </div>
                  <div className="absolute top-0 right-0 w-1 bg-red-650 h-full"></div>
                </div>

                {/* Visual KPI: Data Validation accuracy */}
                <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-3 shadow-[3px_3px_0px_#141414] relative overflow-hidden">
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-mono mb-0.5">ETL Quality Gate</div>
                  <div className="text-lg font-bold text-emerald-800 font-mono tracking-tight">
                    {sqlValidationAccuracy.toFixed(1)}%
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[9px] text-gray-500 border-t border-gray-200 pt-1 font-mono uppercase font-bold">
                    <span>target validation sla</span>
                    <span className="text-emerald-700 font-extrabold flex items-center gap-0.5">
                      {sqlValidationAccuracy >= 95 ? 'SLA_MET' : 'SLA_SHORT'}
                    </span>
                  </div>
                  <div className="absolute top-0 right-0 w-1 bg-emerald-500 h-full"></div>
                </div>
              </div>

              {/* Main Curve Forecast Chart Panel */}
              <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-4 shadow-[4px_4px_0px_#141414]" id="bi-main-chart-card">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 pb-2 border-b border-gray-300">
                  <div>
                    <h3 className="font-extrabold font-serif italic text-sm text-gray-950 tracking-tight flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-slate-850" /> Validation &amp; Net Forward Curve Projections
                    </h3>
                    <p className="text-[10px] text-gray-600 mt-0.5 font-mono">Continuous time-series aggregate trend line. Displays prediction intervals.</p>
                  </div>
                  
                  {/* Legend filter item */}
                  <div className="flex flex-wrap items-center gap-2 text-[9.5px] font-mono font-bold uppercase text-[#141414]">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-blue-600 border border-black inline-block"></span>
                      <span>Actual-Inflow</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-1 border-t-2 border-dashed border-[#141414] inline-block"></span>
                      <span>Predictive-Mean</span>
                    </div>
                    {showConfidenceBands && (
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-violet-100 border border-black inline-block"></span>
                        <span>ConfidenceArea</span>
                      </div>
                    )}
                    
                    {/* Toggle show bounds */}
                    <button
                      onClick={() => setShowConfidenceBands(!showConfidenceBands)}
                      className="px-1.5 py-0.5 border-2 border-[#141414] bg-white rounded-none hover:bg-[#F1EFEC] text-[9.5px] font-bold tracking-wide transition-all"
                    >
                      {showConfidenceBands ? 'HIDE_INTERVALS' : 'SHOW_INTERVALS'}
                    </button>
                  </div>
                </div>

                {/* Simulated SVG Graph Container */}
                <div className="relative border-2 border-[#141414] rounded-none bg-white p-3 min-h-[260px] shadow-[2px_2px_0px_#141414]">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <RefreshCw className="w-6 h-6 text-slate-900 animate-spin" />
                    </div>
                  ) : pointsToRender.length > 0 ? (
                    <div className="w-full overflow-x-auto">
                      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + paddingY * 2}`} className="w-full min-w-[700px] h-[270px]">
                        {/* Horizontal background lines */}
                        {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                          const yVal = paddingY + ratio * chartHeight;
                          const labelVal = Math.round(maxVal - ratio * (maxVal - minVal));
                          return (
                            <g key={i} className="opacity-40">
                              <line
                                x1={paddingX}
                                y1={yVal}
                                x2={chartWidth - paddingX}
                                y2={yVal}
                                stroke="#141414"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={paddingX - 10}
                                y={yVal + 3}
                                textAnchor="end"
                                className="fill-[#141414] font-mono text-[9.5px] font-bold"
                              >
                                ${labelVal.toLocaleString()}
                              </text>
                            </g>
                          );
                        })}

                        {/* Confidence bands envelope */}
                        {showConfidenceBands && generateConfidenceEnvelopePath() && (
                          <path
                            d={generateConfidenceEnvelopePath()}
                            fill="rgba(124, 58, 237, 0.08)"
                            stroke="#141414"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Actuals Line path */}
                        {generateActualsLinePath() && (
                          <path
                            d={generateActualsLinePath()}
                            fill="none"
                            stroke="#1d4ed8"
                            strokeWidth="3.5"
                            strokeLinecap="square"
                            className="drop-shadow-xs"
                          />
                        )}

                        {/* Forecast Mean Line Path */}
                        {generateForecastLinePath() && (
                          <path
                            d={generateForecastLinePath()}
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth="3.5"
                            strokeLinecap="square"
                            strokeDasharray="4 4"
                          />
                        )}

                        {/* Render actual dots/nodes hover components */}
                        {pointsToRender.map((p, idx) => {
                          if (p.actual !== undefined) {
                            const coord = getSvgCoordinates(idx, p.actual);
                            return (
                              <g key={`act-${idx}`}>
                                <rect
                                  x={coord.x - 3.5}
                                  y={coord.y - 3.5}
                                  width="7"
                                  height="7"
                                  className={p.isAnomaly ? "fill-rose-500 stroke-2 stroke-black animate-pulse" : "fill-blue-600 stroke-1.5 stroke-black"}
                                />
                                {p.isAnomaly && (
                                  <rect
                                    x={coord.x - 6.5}
                                    y={coord.y - 6.5}
                                    width="13"
                                    height="13"
                                    fill="none"
                                    stroke="red"
                                    strokeWidth="1"
                                    className="animate-ping"
                                    style={{ animationDuration: '3s' }}
                                  />
                                )}
                              </g>
                            );
                          }
                          
                          if (p.forecast !== undefined) {
                            const coord = getSvgCoordinates(idx, p.forecast);
                            return (
                              <rect
                                key={`for-${idx}`}
                                x={coord.x - 3}
                                y={coord.y - 3}
                                width="6"
                                height="6"
                                className="fill-violet-600 stroke-1 stroke-black"
                              />
                            );
                          }
                          return null;
                        })}

                        {/* Render X-Axis horizontal line */}
                        <line
                          x1={paddingX}
                          y1={chartHeight + paddingY}
                          x2={chartWidth - paddingX}
                          y2={chartHeight + paddingY}
                          stroke="#141414"
                          strokeWidth="2"
                        />

                        {/* Render X-Axis Labels */}
                        {pointsToRender.map((p, idx) => {
                          const coord = getSvgCoordinates(idx, p.forecast || p.actual || 0);
                          // Display month label only every other point to keep legible
                          if (idx % 2 === 0 || idx === pointsToRender.length - 1) {
                            const cleanMonthLabel = p.date.replace('-', '/');
                            return (
                              <text
                                key={`lbl-${idx}`}
                                x={coord.x}
                                y={chartHeight + paddingY + 20}
                                textAnchor="middle"
                                className="fill-[#141414] font-mono text-[9px] font-bold"
                              >
                                {cleanMonthLabel}
                              </text>
                            );
                          }
                          return null;
                        })}
                      </svg>
                    </div>
                  ) : null}

                  {/* High Anomalous Flag alert notification */}
                  {!isAnomalyAdjusted && (
                    <div className="absolute top-3 left-3 bg-[#FFF5F5] border-2 border-[#141414] rounded-none p-2 max-w-xs flex gap-2 shadow-[2px_2px_0px_#141414]" id="anomaly-pbi-indicator">
                      <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold text-[#141414] block">SPARK spike detected</span>
                        <p className="text-[9px] text-[#b91c1c] leading-tight mt-0.5">
                          Anomalous March outlier ($106K) inflates predictive mean curves by over 23%. Adjust filters, use SQL cleansing schemas or smooth outliers.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row Breakdown panel: Category split progress bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Category Splitting Progress Bar */}
                <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-3.5 shadow-[3px_3px_0px_#141414]">
                  <h4 className="font-extrabold font-serif italic text-xs text-gray-950 tracking-tight uppercase mb-3 border-b border-gray-300 pb-1">Forward Booking Distribution (by SKU Category)</h4>
                  
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-mono font-bold">
                        <span className="text-[#141414]">SaaS Subscriptions (ARR)</span>
                        <span className="text-gray-900">${Math.round(48000 * totalScalingFactor).toLocaleString()} (42%)</span>
                      </div>
                      <div className="w-full bg-[#E4E3E0] border border-[#141414] rounded-none h-2">
                        <div className="bg-[#141414] h-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-mono font-bold">
                        <span className="text-[#141414]">Enterprise Core Licenses</span>
                        <span className="text-gray-900">${Math.round(28500 * totalScalingFactor).toLocaleString()} (25%)</span>
                      </div>
                      <div className="w-full bg-[#E4E3E0] border border-[#141414] rounded-none h-2">
                        <div className="bg-slate-700 h-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-mono font-bold">
                        <span className="text-[#141414]">Professional Services</span>
                        <span className="text-gray-900">${Math.round(20500 * totalScalingFactor).toLocaleString()} (18%)</span>
                      </div>
                      <div className="w-full bg-[#E4E3E0] border border-[#141414] rounded-none h-2">
                        <div className="bg-slate-500 h-full" style={{ width: '18%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-mono font-bold">
                        <span className="text-[#141414]">Hardware Gateway APIs</span>
                        <span className="text-gray-900">${Math.round(17000 * totalScalingFactor).toLocaleString()} (15%)</span>
                      </div>
                      <div className="w-full bg-[#E4E3E0] border border-[#141414] rounded-none h-2">
                        <div className="bg-slate-400 h-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Risks Flagged console overlay */}
                <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-3.5 shadow-[3px_3px_0px_#141414] flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold font-serif italic text-xs text-gray-950 tracking-tight uppercase mb-1.5 border-b border-gray-300 pb-1">Scenario Analysis &amp; Risk Ledger</h4>
                    <p className="text-[10px] text-gray-600 mb-2 font-mono">Lists active exposure parameters compiled by python modelling systems.</p>
                    
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto" id="bi-active-risks">
                      {activeRisks.filter(r => r.active).length === 0 ? (
                        <div className="flex items-center gap-1.5 text-emerald-800 bg-white px-2.5 py-2 border border-emerald-600 text-[11px] font-bold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                          <span>NO ACTIVE EXPOSURES. MODEL CONVERGENCE CLEAN.</span>
                        </div>
                      ) : (
                        activeRisks.filter(r => r.active).map(risk => (
                          <div 
                            key={risk.id}
                            className={`flex items-start justify-between p-2 rounded-none text-[11px] border-2 ${
                              risk.impactType === 'negative'
                                ? 'bg-[#FFF5F5] border-[#141414] text-red-950'
                                : 'bg-[#F0FDF4] border-[#141414] text-emerald-950'
                            }`}
                          >
                            <div className="flex items-start gap-1.5 min-w-0">
                              <ShieldAlert className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${risk.impactType === 'negative' ? 'text-rose-600' : 'text-emerald-700'}`} />
                              <div className="min-w-0">
                                <span className="font-bold block truncate font-serif uppercase text-[10px]">{risk.title}</span>
                                <span className="text-[9.5px] text-gray-500 block truncate font-mono">{risk.description}</span>
                              </div>
                            </div>
                            <span className={`font-mono text-[10px] font-bold ${risk.impactType === 'negative' ? 'text-red-700' : 'text-green-700'}`}>
                              {risk.affectedPercentage}%
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-300 flex items-center justify-between text-[9px] font-mono font-bold text-gray-500">
                    <span>LIVE_SYNC_REACTION_PROJECTIONS</span>
                    <span className="italic">MODEL STABLE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReportPage === 'anomalies_audits' && (
            <div className="space-y-4" id="anomalies-and-audits-page">
              <div className="border-b border-gray-300 pb-2">
                <h3 className="font-bold font-serif italic text-sm text-gray-950 tracking-tight flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-[#141414]" /> System Audit Ledger: Proactive Outliers
                </h3>
                <p className="text-[10px] text-gray-600 mt-0.5">Inspect flagged transaction peaks. Review audit logs &amp; direct SQL remediation statements.</p>
              </div>

              {/* Anomaly ledger columns split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                {/* Left side list of reports */}
                <div className="lg:col-span-5 space-y-2">
                  {anomalyReports.map(an => (
                    <button
                      key={an.id}
                      onClick={() => setInspectedAnomalyId(an.id)}
                      className={`w-full text-left p-3 rounded-none border-2 transition-all ${
                        inspectedAnomalyId === an.id
                          ? 'border-[#141414] bg-[#F1EFEC] shadow-[1.5px_1.5px_0px_#141414]'
                          : 'border-[#D4D3D0] hover:border-[#141414] bg-white shadow-[1.5px_1.5px_0px_transparent]'
                      }`}
                      id={`anomaly-item-btn-${an.id}`}
                    >
                      <div className="flex justify-between items-center font-mono">
                        <span className="font-bold text-xs text-gray-950 uppercase">{an.title}</span>
                        <span className={`text-[8px] uppercase tracking-wide px-1.5 py-0.5 border border-[#141414] font-bold ${
                          an.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {an.severity}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 text-[9.5px] text-gray-500 mt-1 font-mono">
                        <span>Date: {an.date}</span>
                        <span>&bull;</span>
                        <span>Reason: {an.category}</span>
                      </div>

                      {/* Status indicator */}
                      <div className="mt-2.5 pt-1.5 border-t border-dashed border-gray-200 flex items-center justify-between text-[9px] font-mono font-bold">
                        <span className="text-gray-400">STATUS:</span>
                        <span className={`tracking-wider text-[9px] ${
                          an.status === 'unresolved' ? 'text-red-650' : 'text-blue-700'
                        }`}>
                          {an.status === 'unresolved' ? 'PENDING_AUDIT' : 'REINTEGRATED_CURVE'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Right side SQL inspection pane */}
                <div className="lg:col-span-7 bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-4 shadow-[3px_3px_0px_#141414] flex flex-col justify-between">
                  {selectedAnomaly ? (
                    <div className="space-y-3.5" id="anomaly-auditor-detail">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-500 font-mono tracking-wider">DIAGNOSTIC FORENSIC LEDGER</span>
                        <h4 className="font-extrabold text-[#141414] font-serif uppercase tracking-tight mt-0.5">{selectedAnomaly.title}</h4>
                        <p className="text-[10.5px] text-gray-700 leading-normal mt-1.5 p-2.5 bg-[#FFF5F5] border-2 border-[#141414] rounded-none shadow-[2px_2px_0px_#141414] font-mono">
                          {selectedAnomaly.description}
                        </p>
                      </div>

                      {/* Associated audit SQL command block */}
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 font-mono uppercase tracking-widest block mb-1">DIAGNOSTIC RESOLUTION RUNTIME</label>
                        <div className="bg-[#1F1F1F] text-[#A5F3FC] p-2.5 border-2 border-[#141414] rounded-none font-mono text-[10px] leading-relaxed relative overflow-x-auto select-all shadow-[2px_2px_0px_#141414]">
                          <code>
                            {selectedAnomaly.sqlAuditQuery}
                          </code>
                          <div className="absolute top-1 right-2 text-[8px] text-[#A3A3A3] uppercase tracking-wider bg-[#1F1F1F] px-1 font-mono">
                            p_sql compiler
                          </div>
                        </div>
                      </div>

                      {/* Recommendation adjustments */}
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 font-mono uppercase tracking-widest block mb-1.5">RECONCILE FORENSIC TARGETS</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onResolveAnomaly(selectedAnomaly.id, 'accepted')}
                            disabled={selectedAnomaly.status === 'accepted'}
                            className={`flex-1 py-1.5 px-3 rounded-none text-xs font-bold font-mono uppercase border-2 border-[#141414] tracking-wide transition-all ${
                              selectedAnomaly.status === 'accepted'
                                ? 'bg-emerald-50 text-emerald-800 border-dashed border-emerald-600 font-extrabold shadow-none cursor-default'
                                : 'bg-[#f2c811] hover:bg-yellow-500 text-black shadow-[1.5px_1.5px_0px_#141414] hover:shadow-[1px_1px_0px_#141414] active:scale-98'
                            }`}
                            id="accept-anomaly-adjustment-btn"
                          >
                            {selectedAnomaly.status === 'accepted' ? '✓ STABILIZED - OUTLIER SMOOTHED' : 'RUN OUTLIER RE-WEIGHTING ALGORITHM'}
                          </button>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 block mt-1.5 leading-tight">
                          Executing reconciliations refactors outlier coefficient intercepts back to predictive models mean width dynamically.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-gray-400 h-full flex flex-col justify-center items-center">
                      <HelpCircle className="w-8 h-8 opacity-40 mb-2 block animate-bounce" />
                      <p className="text-xs">Select an anomaly record to begin diagnostic investigation.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
