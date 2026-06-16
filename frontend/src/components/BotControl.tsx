import React, { useState } from 'react';
import { botApi } from '../api/client';

const strategies = [
  { value: 'MACross', label: 'MA Cross (SMA 20/50)' },
  { value: 'RSIBB', label: 'RSI + Bollinger Bands' },
  { value: 'MACD', label: 'MACD Crossover' },
];

const BotControl: React.FC = () => {
  const [strategy, setStrategy] = useState('MACross');
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [capital, setCapital] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    setStatus('');
    try {
      await botApi.start({ strategy, symbol, capital });
      setIsRunning(true);
      setStatus('Bot started successfully');
    } catch (e: any) {
      setStatus(`Error: ${e.response?.data?.detail || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await botApi.stop();
      setIsRunning(false);
      setStatus('Bot stopped');
    } catch (e: any) {
      setStatus(`Error: ${e.response?.data?.detail || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h2 className="font-semibold text-slate-200 mb-4">Bot Control</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Strategy</label>
          <select
            value={strategy}
            onChange={e => setStrategy(e.target.value)}
            disabled={isRunning}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            {strategies.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            disabled={isRunning}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            placeholder="BTC/USDT"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Capital (USD)</label>
          <input
            type="number"
            value={capital}
            onChange={e => setCapital(Number(e.target.value))}
            disabled={isRunning}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        <button
          onClick={isRunning ? handleStop : handleStart}
          disabled={loading}
          className={`w-full py-2 rounded font-medium text-sm transition-colors disabled:opacity-50 ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {loading ? 'Please wait...' : isRunning ? 'Stop Bot' : 'Start Bot'}
        </button>

        {status && (
          <p className={`text-xs ${status.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
            {status}
          </p>
        )}

        <div className="mt-4 p-3 bg-slate-700 rounded text-xs">
          <p className="text-slate-400 mb-1">Mode: Paper Trading</p>
          <p className="text-slate-400">No real funds used</p>
        </div>
      </div>
    </div>
  );
};

export default BotControl;
