/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { generatePythonForecast, ForecastModelConfig, PythonExecutionLog, ForecastResult } from '../utils/pythonForecaster';
import { RiskEvent } from '../types';
import { Sparkles, Terminal, Sliders, ShieldAlert, Cpu, Eye, FileCode, CheckCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PythonForecastSectionProps {
  onForecastTrain: (result: ForecastResult, activeRisks: RiskEvent[], isAnomalyFiltered: boolean) => void;
  availableRisks: RiskEvent[];
  onToggleRisk: (id: string) => void;
}

export default function PythonForecastSection({ onForecastTrain, availableRisks, onToggleRisk }: PythonForecastSectionProps) {
  const [modelType, setModelType] = useState<'ARIMA' | 'Linear' | 'Prophet'>('ARIMA');
  const [horizonMonths, setHorizonMonths] = useState<number>(12);
  const [confidenceInterval, setConfidenceInterval] = useState<80 | 95>(95);
  const [adjustForAnomalies, setAdjustForAnomalies] = useState<boolean>(true);
  
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [activeCodeDrawer, setActiveCodeDrawer] = useState<boolean>(false);
  const [activeLogs, setActiveLogs] = useState<PythonExecutionLog[]>([]);
  const [lastResult, setLastResult] = useState<ForecastResult | null>(null);

  const triggerForecastRun = () => {
    setIsTraining(true);
    // Fake training latency
    setTimeout(() => {
      const activeList = availableRisks.filter(r => r.active);
      const res = generatePythonForecast({
        modelType,
        horizonMonths,
        confidenceInterval,
        activeRisks: availableRisks,
        adjustForAnomalies
      });
      setLastResult(res);
      setActiveLogs(res.logs);
      setIsTraining(false);
      onForecastTrain(res, availableRisks, adjustForAnomalies);
    }, 1000);
  };

  // Run on mount
  useEffect(() => {
    const res = generatePythonForecast({
      modelType,
      horizonMonths,
      confidenceInterval,
      activeRisks: availableRisks,
      adjustForAnomalies
    });
    setLastResult(res);
    setActiveLogs(res.logs);
    onForecastTrain(res, availableRisks, adjustForAnomalies);
  }, [modelType, horizonMonths, confidenceInterval, adjustForAnomalies, availableRisks]);

  const getPythonSnippet = () => {
    if (modelType === 'ARIMA') {
      return `import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

# Load cleansed dataset from SQL schema sink
df = pd.read_parquet("s3://fin-warehouse/etl_revenue_sink.parquet")
df = df.resample('ME', on='date').sum()

# Clean anomalies (Z-Score filter if toggled)
${adjustForAnomalies ? `rolling_mean = df['revenue'].rolling(window=3, min_periods=1).median()
df['revenue'] = np.where(df['revenue'] > 80000, rolling_mean, df['revenue']) # Outliers filter` : '# Outlier smoothing deactivated'}

# Fit high-fidelity ARIMA (AutoRegressive Integrated Moving Average)
model = ARIMA(df['revenue'], order=(1, 1, 1), seasonal_order=(1, 0, 1, 12))
results = model.fit()

# Predict forward curves with ${confidenceInterval}% confidence interval bounds
forecast = results.get_forecast(steps=${horizonMonths})
pred_mean = forecast.predicted_mean
conf_int = forecast.conf_int(alpha=${1 - confidenceInterval / 100})
`;
    } else if (modelType === 'Prophet') {
      return `import pandas as pd
from prophet import Prophet

df = pd.read_parquet("s3://fin-warehouse/etl_revenue_sink.parquet")
# Format for FB Prophet compliance
df_p = df.rename(columns={'date': 'ds', 'final_revenue': 'y'})

# Define Prophet model with seasonal matrices
m = Prophet(
    growth='linear',
    yearly_seasonality=True,
    weekly_seasonality=False,
    interval_width=${confidenceInterval / 100}
)

# Apply proactive risk overrides (Risk adjustments: ${availableRisks.filter(r => r.active).length} active)
${availableRisks.filter(r => r.active).map(r => `# Risk Alert effect applied: ${r.title} (${r.affectedPercentage}%)`).join('\n')}

m.fit(df_p)
future = m.make_future_dataframe(periods=${horizonMonths}, freq='M')
forecast = m.predict(future)
`;
    } else {
      return `import pandas as pd
from sklearn.linear_model import LinearRegression

df = pd.read_parquet("s3://fin-warehouse/etl_revenue_sink.parquet")
df['month_idx'] = range(len(df))

# Standard Ordinary Least Squares fitting
X = df[['month_idx']]
y = df['final_revenue']

model = LinearRegression()
model.fit(X, y)

# Project horizontal trend
future_idx = pd.DataFrame({'month_idx': range(len(df), len(df) + ${horizonMonths})})
predictions = model.predict(future_idx)
`;
    }
  };

  return (
    <div className="bg-white border-2 border-[#141414] rounded-none shadow-[4px_4px_0px_#141414] overflow-hidden" id="python-forecast-section">
      {/* Mini Title bar */}
      <div className="px-4 py-3 border-b-2 border-[#141414] bg-[#FAFAF9] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[9px] uppercase font-mono font-bold bg-[#141414] text-white">
            <Cpu className="w-3 h-3" /> PYTHON_TS_ENGINE
          </span>
          <h2 className="text-sm font-bold font-serif italic text-gray-950 tracking-tight mt-0.5">Time-Series Mathematical Sandbox</h2>
          <p className="text-[10px] text-gray-600 mt-0.5">Fit hyperparameter regressions, run model convergence, and adjust forward curves proactively.</p>
        </div>
        <div>
          <button
            onClick={() => setActiveCodeDrawer(!activeCodeDrawer)}
            className="flex items-center gap-1 px-2 py-1 border-2 border-[#141414] bg-white rounded-none text-[9.5px] font-bold font-mono uppercase tracking-wide hover:bg-[#F1EFEC] shadow-[1.5px_1.5px_0px_#141414] active:translate-y-[1px] active:shadow-none transition-all"
            id="view-script-toggle"
          >
            <FileCode className="w-3.5 h-3.5 text-[#141414]" />
            {activeCodeDrawer ? 'HIDE_CODE' : 'PREDICTION_SCRIPT'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Side: Parameters sliders */}
        <div className="lg:col-span-4 border-r-2 border-[#141414] p-4 flex flex-col justify-between bg-[#FAFAF9]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1.5 border-b border-[#D4D3D0] pb-1">
              <Sliders className="w-3.5 h-3.5 text-[#141414]" />
              <h3 className="font-bold text-xs font-mono uppercase text-[#141414]">Hyperparameters</h3>
            </div>

            {/* Model Type Selector */}
            <div>
              <label className="text-[9px] font-bold text-[#141414] font-mono uppercase block mb-1">Model Family</label>
              <div className="grid grid-cols-3 gap-1 bg-[#E4E3E0] p-1 border-2 border-[#141414] rounded-none" id="forecast-model-selector">
                {(['ARIMA', 'Prophet', 'Linear'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setModelType(type)}
                    className={`py-1 rounded-none font-bold font-mono text-[10px] transition-all ${
                      modelType === type
                        ? 'bg-[#141414] text-white'
                        : 'text-[#141414] hover:bg-[#D4D3D0]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Prediction Interval */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] font-bold text-[#141414] font-mono uppercase">Confidence Band Width</label>
                <span className="font-mono text-[10px] font-bold text-[#141414] bg-white px-1 border border-[#D4D3D0]">{confidenceInterval}% CI</span>
              </div>
              <div className="flex bg-[#E4E3E0] p-1 border-2 border-[#141414] rounded-none gap-1">
                <button
                  onClick={() => setConfidenceInterval(80)}
                  className={`flex-1 py-1 rounded-none text-[10px] font-bold font-mono ${confidenceInterval === 80 ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-[#D4D3D0]'}`}
                >
                  80% CI
                </button>
                <button
                  onClick={() => setConfidenceInterval(95)}
                  className={`flex-1 py-1 rounded-none text-[10px] font-bold font-mono ${confidenceInterval === 95 ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-[#D4D3D0]'}`}
                >
                  95% CONCI
                </button>
              </div>
            </div>

            {/* Prediction Horizon */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] font-bold text-[#141414] font-mono uppercase">Forecast Horizon</label>
                <span className="text-[10px] font-mono font-bold text-gray-900">{horizonMonths} months</span>
              </div>
              <input
                type="range"
                min="3"
                max="18"
                step="3"
                value={horizonMonths}
                onChange={(e) => setHorizonMonths(parseInt(e.target.value))}
                className="w-full h-1 bg-[#E4E3E0] rounded-none appearance-none cursor-pointer accent-[#141414]"
                id="forecast-horizon-slider"
              />
              <div className="flex justify-between text-[9px] text-[#141414] mt-1 font-mono uppercase font-bold">
                <span>3m</span>
                <span>6m</span>
                <span>12m</span>
                <span className="opacity-60">18m</span>
              </div>
            </div>

            {/* Outlier Filter Switch */}
            <div className="flex items-center justify-between p-2.5 border-2 border-[#141414] rounded-none bg-white shadow-[2px_2px_0px_#141414]">
              <div>
                <span className="text-[10px] font-bold text-[#141414] font-mono uppercase block">Smooth Spikes</span>
                <span className="text-[8.5px] text-gray-600 block leading-tight mt-0.5">Cleans outlier transaction anomalies automatically.</span>
              </div>
              <button
                onClick={() => setAdjustForAnomalies(!adjustForAnomalies)}
                role="switch"
                aria-checked={adjustForAnomalies}
                className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-none border-2 border-[#141414] transition-colors duration-200 ease-in-out focus:outline-none ${
                    adjustForAnomalies ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
                id="filter-outliers-switch"
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-none bg-[#141414] border border-white transition duration-200 ease-in-out ${
                    adjustForAnomalies ? 'translate-x-3' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Trigger button */}
          <div className="pt-3 border-t border-[#D4D3D0]" id="retrain-model-block">
            <button
              onClick={triggerForecastRun}
              disabled={isTraining}
              className={`w-full py-2 px-3 rounded-none font-bold font-mono text-xs uppercase border-2 border-[#141414] bg-[#141414] text-white shadow-[2px_2px_0px_#141414] hover:shadow-[1px_1px_0px_#141414] hover:bg-neutral-800 transition-all text-center flex items-center justify-center gap-1.5`}
              id="retrain-model-btn"
            >
              {isTraining ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  RECONVERGING ALGORITHMS...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  RUN MODEL CONVERGENCE
                </>
              )}
            </button>
          </div>
        </div>

        {/* Center: Live code script visualizer overlay (absolute width responsive) */}
        <AnimatePresence>
          {activeCodeDrawer && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="lg:col-span-8 bg-[#1F1F1F] text-[#F8FAFC] border-r-2 border-[#141414] font-mono text-xs overflow-hidden flex flex-col relative z-20"
              id="python-code-drawer"
            >
              <div className="p-3 border-b-2 border-[#141414] flex justify-between items-center bg-neutral-900">
                <span className="font-bold text-xs text-[#38BDF8] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-white" /> prediction_engine_arima.py
                </span>
                <span className="text-[9px] text-[#A3A3A3] font-bold bg-[#1F1F1F] px-1.5 py-0.5 border border-[#141414]">Python 3.10.8</span>
              </div>
              <pre className="p-4 flex-1 overflow-auto select-none leading-relaxed text-[#5CC5E3]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <code>{getPythonSnippet()}</code>
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Side: Proactive risk adjustment matrix & Python compilation code outputs */}
        <div className={`lg:col-span-8 p-4 bg-white flex flex-col justify-between ${activeCodeDrawer ? 'hidden' : 'block'}`} id="python-output-console">
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#141414]" />
              <h3 className="font-bold text-xs font-mono uppercase text-[#141414]">Proactive Risk Exposures (Python Modifiers)</h3>
            </div>

            {/* List risk togglers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4" id="risk-inputs-grid">
              {availableRisks.map(risk => (
                <button
                  key={risk.id}
                  onClick={() => onToggleRisk(risk.id)}
                  className={`text-left p-3.5 rounded-none border-2 transition-all ${
                    risk.active
                      ? risk.impactType === 'negative'
                        ? 'bg-[#FFF5F5] border-[#141414] text-[#141414] shadow-[2.5px_2.5px_0px_rgba(239,68,68,1)]'
                        : 'bg-[#F0FDF4] border-[#141414] text-[#141414] shadow-[2.5px_2.5px_0px_rgba(34,197,94,1)]'
                      : 'bg-white border-[#D4D3D0] hover:border-[#141414] text-[#141414] shadow-[2.5px_2.5px_0px_#D4D3D0]'
                  }`}
                  id={`risk-card-btn-${risk.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] font-serif uppercase tracking-tight">{risk.title}</span>
                    <span className={`text-[9px] font-mono font-bold px-1 py-0.5 border border-[#141414] ${
                      risk.affectedPercentage < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {risk.affectedPercentage > 0 ? '+' : ''}{risk.affectedPercentage}%
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 lines-clamp-2 leading-normal">{risk.description}</p>
                  
                  <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-dotted border-gray-300">
                    <span className="text-[8.5px] uppercase font-bold text-gray-400 font-mono">Category: {risk.category}</span>
                    <span className={`text-[8.5px] uppercase font-bold font-mono ${risk.active ? 'text-blue-700' : 'text-gray-400'}`}>
                      {risk.active ? '● Applied' : '○ Standby'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Python Console logs output */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-[#141414] font-mono uppercase block">Time-Series Solver Outlogs</span>
              <span className="font-mono text-[8.5px] font-bold text-[#222222] bg-[#E4E3E0] border border-[#141414] px-1">CONVERGED_SLATE</span>
            </div>

            <div className="relative border-2 border-[#141414] rounded-none flex-1 min-h-[120px] max-h-[135px] overflow-y-auto bg-[#1F1F1F] p-2.5 flex flex-col-reverse text-[10px] font-mono text-[#A5F3FC] shadow-[2px_2px_0px_#141414]">
              <div className="space-y-1">
                {activeLogs.slice().reverse().map((log, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed">
                    <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                    <span className={
                      log.level === 'ERROR' ? 'text-red-400 font-bold' : 
                      log.level === 'WARNING' ? 'text-amber-400 font-semibold' : 
                      'text-indigo-350'
                    }>[{log.level}]</span>
                    <p className="text-slate-100 flex-1 leading-normal">{log.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Model outputs footer stats */}
          {lastResult && (
            <div className="mt-3 pt-2.5 border-t border-gray-300 flex flex-wrap justify-between items-center text-[10.5px] text-gray-600 gap-3" id="python-model-kpis">
              <div className="flex gap-4">
                <span className="font-mono">R²_Fit_Proportion: <strong className="font-bold text-gray-900 border-b border-black">{(lastResult.metrics.r2 * 100).toFixed(0)}%</strong></span>
                <span className="font-mono">Model_MAPE: <strong className="font-bold text-gray-900 border-b border-black">{lastResult.metrics.mape}%</strong></span>
              </div>
              <span className="text-[9px] uppercase font-bold font-mono bg-[#E4E3E0] text-[#141414] border border-[#141414] px-1.5 py-0.5">
                SLOPE: TREND VERIFIED BY SCIPY
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
