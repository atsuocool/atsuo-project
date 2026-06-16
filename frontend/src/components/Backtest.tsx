import React, { useState } from 'react';
import { backtestApi, BacktestResult } from '../api/client';

const strategies = [
  { value: 'MACross', label: 'MA Cross (SMA 20/50)' },
  { value: 'RSIBB', label: 'RSI + Bollinger Bands' },
  { value: 'MACD', label: 'MACD Crossover' },
];

const Backtest: React.FC = () => {
  const [form, setForm] = useState({
    symbol: 'BTC-USD',
    strategy: 'MACross',
    start_date: '2023-01-01',
    end_date: '2024-01-01',
    initial_capital: 10000,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState('');

  const handleRun = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await backtestApi.run(form);
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold text-slate-100 mb-6">Backtest Strategy</h1>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Symbol (yfinance format)</label>
            <input
              type="text"
              value={form.symbol}
              onChange={e => setForm({ ...form, symbol: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="BTC-USD"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Strategy</label>
            <select
              value={form.strategy}
              onChange={e => setForm({ ...form, strategy: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {strategies.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Initial Capital (USD)</label>
            <input
              type="number"
              value={form.initial_capital}
              onChange={e => setForm({ ...form, initial_capital: Number(e.target.value) })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <button
          onClick={handleRun}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded font-medium text-sm disabled:opacity-50"
        >
          {loading ? 'Running Backtest...' : 'Run Backtest'}
        </button>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Return', value: `${result.total_return >= 0 ? '+' : ''}${result.total_return.toFixed(2)}%`, positive: result.total_return >= 0 },
              { label: 'Sharpe Ratio', value: result.sharpe_ratio.toFixed(3) },
              { label: 'Max Drawdown', value: `-${result.max_drawdown.toFixed(2)}%`, positive: false },
              { label: 'Win Rate', value: `${result.win_rate.toFixed(1)}%`, positive: result.win_rate >= 50 },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.positive === true ? 'text-emerald-400' : stat.positive === false ? 'text-red-400' : 'text-slate-100'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="font-semibold text-slate-200 mb-3">Trade History ({result.trades.length} trades)</h3>
            <div className="overflow-auto max-h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Side</th>
                    <th className="text-right py-2 pr-4">Price</th>
                    <th className="text-right py-2 pr-4">Qty</th>
                    <th className="text-right py-2">PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.map((t, i) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-1.5 pr-4 text-slate-400">{new Date(t.timestamp).toLocaleDateString()}</td>
                      <td className={`py-1.5 pr-4 font-medium ${t.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{t.side.toUpperCase()}</td>
                      <td className="py-1.5 pr-4 text-right">${t.price.toLocaleString()}</td>
                      <td className="py-1.5 pr-4 text-right">{t.quantity.toFixed(6)}</td>
                      <td className={`py-1.5 text-right ${(t.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backtest;
