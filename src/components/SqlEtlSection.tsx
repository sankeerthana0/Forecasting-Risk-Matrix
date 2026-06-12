/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { executeSimulationQuery, SqlResult } from '../utils/sqlExecutor';
import { presetQueries } from '../data/mockData';
import { Database, Play, CheckCircle, AlertTriangle, FileSpreadsheet, Layers, RefreshCw, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SqlEtlSectionProps {
  onPipelineRun: (schemaAccuracy: number, totalProcessedCount: number) => void;
  etlDatabaseRefreshed: boolean;
}

export default function SqlEtlSection({ onPipelineRun, etlDatabaseRefreshed }: SqlEtlSectionProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('q1');
  const [sqlContent, setSqlContent] = useState<string>(presetQueries[0].sql);
  const [running, setRunning] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<SqlResult | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'schema' | 'validation'>('editor');

  const selectedPreset = presetQueries.find(q => q.id === selectedPresetId);

  const handlePresetSelect = (id: string) => {
    setSelectedPresetId(id);
    const q = presetQueries.find(item => item.id === id);
    if (q) {
      setSqlContent(q.sql);
    }
  };

  const handleRunQuery = () => {
    setRunning(true);
    setTimeout(() => {
      const result = executeSimulationQuery(sqlContent);
      setQueryResult(result);
      setRunning(false);
      // Callback to app standard settings
      onPipelineRun(result.accuracyMetric, result.totalCount);
    }, 1200); // realistic query latency
  };

  // Immediate default query execute on mount to load initial variables
  React.useEffect(() => {
    const result = executeSimulationQuery(sqlContent);
    setQueryResult(result);
    onPipelineRun(result.accuracyMetric, result.totalCount);
  }, []);

  return (
    <div className="bg-white border-2 border-[#141414] rounded-none shadow-[4px_4px_0px_#141414] overflow-hidden" id="sql-etl-section">
      {/* Header section */}
      <div className="px-4 py-3 border-b-2 border-[#141414] bg-[#FAFAF9] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[9px] uppercase font-mono font-bold bg-[#141414] text-white mb-1.5">
            <Layers className="w-3 h-3" id="etl-stage-badge" /> PSQL ENGINE NODE
          </span>
          <h2 className="text-sm font-bold font-serif italic text-gray-950 tracking-tight">Structured Data Extraction &amp; Cleansing</h2>
          <p className="text-[10px] text-gray-600 mt-0.5">Extract raw POS streams, perform high-fidelity joins, and filter out failed transaction entries.</p>
        </div>
        <div className="flex gap-2">
          {etlDatabaseRefreshed && (
            <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-white px-2 py-0.5 rounded-none border border-green-600 font-mono font-semibold">
              <RefreshCw className="w-3 h-3" /> SYNCED
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Control Column - Preset selection & editor */}
        <div className="lg:col-span-5 border-r-2 border-[#141414] p-4 flex flex-col bg-[#FAFAF9]">
          {/* Section Tabs */}
          <div className="flex bg-[#E4E3E0] p-1 border-2 border-[#141414] rounded-none mb-3 text-xs font-bold font-mono" id="etl-tabs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 py-1 px-2 rounded-none transition-all ${
                activeTab === 'editor'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-[#D4D3D0]'
              }`}
              id="etl-tab-editor"
            >
              SQL EDITOR
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`flex-1 py-1 px-2 rounded-none transition-all ${
                activeTab === 'schema'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-[#D4D3D0]'
              }`}
              id="etl-tab-schema"
            >
              DB SCHEMA
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className={`flex-1 py-1 px-2 rounded-none transition-all ${
                activeTab === 'validation'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-[#D4D3D0]'
              }`}
              id="etl-tab-validation"
            >
              VALIDATION
            </button>
          </div>

          {activeTab === 'editor' && (
            <div className="flex-1 flex flex-col">
              {/* Presets List */}
              <label className="text-[10px] font-bold text-[#141414] font-mono uppercase block mb-1.5">Preset Scripts</label>
              <div className="grid grid-cols-1 gap-1.5 mb-3">
                {presetQueries.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetSelect(p.id)}
                    className={`text-left p-2 rounded-none border-2 transition-all ${
                      selectedPresetId === p.id
                        ? 'border-[#141414] bg-[#F1EFEC] text-[#141414] shadow-[1.5px_1.5px_0px_#141414]'
                        : 'border-[#D4D3D0] bg-white hover:border-[#141414] text-gray-700'
                    }`}
                    id={`preset-btn-${p.id}`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs font-mono uppercase text-[#141414]">
                      <Code className="w-3.5 h-3.5 text-slate-800" />
                      {p.title}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1 leading-none">{p.description}</p>
                  </button>
                ))}
              </div>

              {/* Editable TextArea */}
              <div className="relative flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-[#141414] font-mono uppercase block mb-1.5">Console Compiler</label>
                <div className="relative flex-1 border-2 border-[#141414] rounded-none overflow-hidden font-mono text-[11px] bg-[#1F1F1F] text-slate-100 flex flex-col min-h-[180px] shadow-[2px_2px_0px_#141414]">
                  <div className="bg-neutral-900 px-3 py-1 border-b border-neutral-855 text-[9px] text-[#A3A3A3] flex items-center justify-between">
                    <span>warehouse_host: postgres://warehouse_net</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <textarea
                    value={sqlContent}
                    onChange={(e) => setSqlContent(e.target.value)}
                    className="w-full flex-1 p-3 bg-transparent resize-none focus:outline-none leading-relaxed text-[#A5F3FC]"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    spellCheck="false"
                    id="sql-query-textarea"
                  />
                </div>
              </div>

              {/* Execution Actions */}
              <button
                onClick={handleRunQuery}
                disabled={running}
                className={`mt-3.5 w-full py-2 px-3 rounded-none font-bold font-mono uppercase text-xs border-2 border-[#141414] bg-[#141414] hover:bg-neutral-800 text-white shadow-[2px_2px_0px_#141414] hover:shadow-[1px_1px_0px_#141414] active:scale-98 transition-all flex items-center justify-center gap-2`}
                id="run-sql-pipeline-btn"
              >
                {running ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-300" />
                    COMPILING LEDGER JOINS...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    RUN ANALYTICS ETL PIPELINE
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              <p className="text-gray-600 text-[11px]">Normalized star-schema configuration. Integrations pass constraint checks safely before Power BI feeding.</p>
              
              <div className="border-2 border-[#141414] rounded-none p-2.5 bg-white shadow-[2px_2px_0px_#141414]">
                <div className="flex items-center gap-1.5 font-bold font-mono text-[#141414] text-xs border-b border-[#D4D3D0] pb-1 mb-1.5">
                  <span>raw_transactions (Fact)</span>
                </div>
                <ul className="space-y-1 text-gray-700 font-mono text-[10.5px]">
                  <li>• id [VARCHAR(10)] <span className="text-slate-400 font-semibold">(PK)</span></li>
                  <li>• date [DATE]</li>
                  <li>• amount [DECIMAL(12,2)]</li>
                  <li>• customerId [VARCHAR(10)] <span className="text-slate-400 font-semibold">(FK)</span></li>
                  <li>• productId [VARCHAR(10)] <span className="text-slate-400 font-semibold">(FK)</span></li>
                  <li>• status [VARCHAR(12)]</li>
                </ul>
              </div>

              <div className="border-2 border-[#141414] rounded-none p-2.5 bg-white shadow-[2px_2px_0px_#141414]">
                <div className="flex items-center gap-1.5 font-bold font-mono text-[#141414] text-xs border-b border-[#D4D3D0] pb-1 mb-1.5">
                  <span>customer_profiles (Dim)</span>
                </div>
                <ul className="space-y-1 text-gray-700 font-mono text-[10.5px]">
                  <li>• id [VARCHAR(10)] <span className="text-slate-400 font-semibold">(PK)</span></li>
                  <li>• name [VARCHAR(120)]</li>
                  <li>• tier [VARCHAR(15)]</li>
                  <li>• industry [VARCHAR(40)]</li>
                </ul>
              </div>

              <div className="border-2 border-[#141414] rounded-none p-2.5 bg-white shadow-[2px_2px_0px_#141414]">
                <div className="flex items-center gap-1.5 font-bold font-mono text-[#141414] text-xs border-b border-[#D4D3D0] pb-1 mb-1.5">
                  <span>product_catalog (Dim)</span>
                </div>
                <ul className="space-y-1 text-gray-700 font-mono text-[10.5px]">
                  <li>• id [VARCHAR(10)] <span className="text-slate-400 font-semibold">(PK)</span></li>
                  <li>• name [VARCHAR(100)]</li>
                  <li>• category [VARCHAR(30)]</li>
                  <li>• unitPrice [DECIMAL(10,2)]</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
              <div className="p-2.5 bg-[#FFF5F5] border-2 border-[#141414] rounded-none shadow-[2px_2px_0px_#141414]">
                <h4 className="font-bold text-[#141414] font-mono text-[11px] flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> RULE_01: ZERO-VALUE CORRECTION
                </h4>
                <p className="text-slate-700 text-[10px] leading-relaxed">
                  Amounts under $0 imply transaction failure. Checked by checking line values in raw transactions parser.
                </p>
              </div>

              <div className="p-2.5 bg-[#FFFBEB] border-2 border-[#141414] rounded-none shadow-[2px_2px_0px_#141414]">
                <h4 className="font-bold text-[#141414] font-mono text-[11px] flex items-center gap-1.5 mb-1">
                  <CheckCircle className="w-3.5 h-3.5" /> RULE_02: COMPLETED STATUS ONLY
                </h4>
                <p className="text-slate-700 text-[10px] leading-relaxed">
                  Filters pending or canceled ledger bounds immediately to isolate forecast distortion.
                </p>
              </div>

              <div className="p-2.5 bg-[#EFF6FF] border-2 border-[#141414] rounded-none shadow-[2px_2px_0px_#141414]">
                <h4 className="font-bold text-[#141414] font-mono text-[11px] flex items-center gap-1.5 mb-1">
                  <Database className="w-3.5 h-3.5" /> RULE_03: ENTITY INTEGRITY CHECK
                </h4>
                <p className="text-slate-700 text-[10px] leading-relaxed">
                  Inner joins guarantee exact client-tier matching. Discrepancies clear safely.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Output Column - Real-time ETL execution result */}
        <div className="lg:col-span-7 bg-white p-4 flex flex-col justify-between overflow-x-hidden">
          {running ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" id="etl-loader">
              <div className="relative">
                <div className="w-12 h-12 rounded-none border-4 border-[#141414] border-t-transparent animate-spin flex items-center justify-center"></div>
                <Database className="w-4 h-4 text-[#141414] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-xs font-bold font-mono uppercase text-gray-900 mt-4 tracking-tight">Compiling Relational Statement</h3>
              <p className="text-[10px] text-gray-500 max-w-sm mt-1 leading-relaxed font-mono">
                [ETL]: FETCHING SINK COUPLING KEYS AND COMPILING LEDGER OUTCOMES...
              </p>
              
              {/* Fake visual stepping indicator */}
              <div className="flex items-center gap-2 mt-4 text-[9px] text-[#141414] font-mono uppercase bg-[#E4E3E0] px-2 py-1">
                <span className="font-bold">Extraction</span>
                <span>&rarr;</span>
                <span className="font-bold animate-pulse">Cleansing</span>
                <span>&rarr;</span>
                <span className="text-gray-500/60">Load</span>
              </div>
            </div>
          ) : queryResult ? (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col justify-between"
              id="etl-success-view"
            >
              <div>
                {/* Meta stats banner */}
                <div className="grid grid-cols-3 gap-2 mb-3" id="etl-stats-dashboard">
                  <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-2 shadow-[2px_2px_0px_#141414]">
                    <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Ingress Vol</div>
                    <div className="text-sm font-bold text-gray-950 mt-0.5 font-mono">{queryResult.totalCount} <span className="text-[9px] text-[#141414] font-normal">lines</span></div>
                  </div>
                  <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-2 shadow-[2px_2px_0px_#141414]">
                    <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">System Accuracy</div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5 flex items-center gap-1 font-mono">
                      {queryResult.accuracyMetric}%
                    </div>
                  </div>
                  <div className="bg-[#FAFAF9] border-2 border-[#141414] rounded-none p-2 shadow-[2px_2px_0px_#141414]">
                    <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Outliers / Drops</div>
                    <div className="text-sm font-bold text-[#b91c1c] mt-0.5 font-mono">{queryResult.invalidCount}</div>
                  </div>
                </div>

                {/* Simulated Console Logs Explaining Outcome */}
                <div className="bg-[#1F1F1F] p-2.5 rounded-none text-[10px] font-mono text-slate-100 border-2 border-[#141414] mb-3 flex items-start gap-1.5 leading-relaxed">
                  <span className="text-amber-400 font-bold flex-shrink-0">[LEDGER]:</span>
                  <p>{queryResult.summary}</p>
                </div>

                {/* Table output */}
                <label className="text-[9px] font-bold text-[#141414] font-mono uppercase block mb-1">RELATIONAL SINK PREVIEW</label>
                <div className="border-2 border-[#141414] rounded-none overflow-hidden bg-white shadow-[2px_2px_0px_#141414] max-h-[190px] overflow-y-auto relative">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#F1EFEC] border-b-2 border-[#141414] sticky top-0 uppercase font-mono text-[9px] text-gray-700 font-bold tracking-wider">
                      <tr>
                        {queryResult.columns.map(col => (
                          <th key={col} className="p-1 px-2 first:pl-2 last:pr-2 font-bold">{col.replace('_', ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-350 font-mono text-[10.5px] text-gray-900 bg-white">
                      {queryResult.rows.map((row, idx) => (
                        <tr 
                          key={idx} 
                          className={`hover:bg-[#FAFAF9] transition-colors ${
                            row.validation_result?.includes('REJECTED') ? 'bg-[#FFF5F5]' : ''
                          }`}
                        >
                          {queryResult.columns.map(col => {
                            let cellVal = row[col];
                            let cellStyle = "p-1 px-2 font-mono first:pl-2 last:pr-2 text-[10.5px] border-r border-[#D4D3D0] last:border-r-0";

                            // Visual highlighting for specific rows/cells
                            if (col === 'validation_result') {
                              if (cellVal.startsWith('REJECTED')) {
                                return (
                                  <td key={col} className={`${cellStyle} text-red-650 bg-[#FFF5F5] font-bold`}>
                                    <span className="inline-block text-[8px] uppercase tracking-wide px-1 py-0.5 rounded-none bg-red-100 font-bold border border-[#141414]">{cellVal}</span>
                                  </td>
                                );
                              } else {
                                return (
                                  <td key={col} className={`${cellStyle} text-emerald-850 font-bold bg-[#E8F5E9]/30`}>
                                    <span className="inline-block text-[8px] uppercase tracking-wide px-1 py-0.5 rounded-none bg-emerald-100 font-bold border border-[#141414]">{cellVal}</span>
                                  </td>
                                );
                              }
                            }

                            if (col === 'final_revenue' || col === 'total_net_rev' || col === 'total_gross_rev' || col === 'raw_amount') {
                              const v = typeof cellVal === 'string' ? parseFloat(cellVal) : cellVal;
                              return (
                                <td key={col} className={`${cellStyle} font-bold text-right ${v < 0 ? 'text-red-600' : 'text-gray-950'}`}>
                                  ${v.toLocaleString()}
                                </td>
                              );
                            }

                            return (
                              <td key={col} className={cellStyle}>
                                {cellVal}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data quality notice */}
              <div className="mt-2 pt-2 border-t border-[#141414] flex items-center justify-between text-[10px] font-mono text-gray-500">
                <span className="flex items-center gap-1 font-bold">
                  ● AUTO_VALIDATED
                </span>
                <span>STATUS: READY FOR REPORTING</span>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8 text-gray-500">
              <Database className="w-8 h-8 opacity-40 mb-2 block mx-auto animate-pulse" />
              <p className="text-xs">Compile and run SQL pipeline queries to preview cleansed datasets here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
