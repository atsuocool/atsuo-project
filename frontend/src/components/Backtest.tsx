import React, { useState } from 'react';
import { runBacktest } from '../api/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Backtest() {
  const [form, setForm] = useState({ symbol: 'BTC-USD', strategy: 'ma_cross', start_date: '2023-01-01', end_date: '2024-01-01', initial_capital: 10000 });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strategies = [
    { value: 'ma_cross', label: 'MA クロス' },
    { value: 'rsi_bb', label: 'RSI + ボリンジャーバンド' },
    { value: 'macd', label: 'MACD' },
  ];

  const handleRun = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await runBacktest(form);
      setResult(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'エラーが発生しました');
    }
    setLoading(false);
  };

  const inp = { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', width: '100%' };

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ marginTop: 0, color: '#38bdf8' }}>バックテスト</h2>
      <div style={{ background: '#1e293b', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#94a3b8' }}>シンボル</label>
            <input value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#94a3b8' }}>戦略</label>
            <select value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })} style={inp}>
              {strategies.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#94a3b8' }}>初期資金 (USD)</label>
            <input type="number" value={form.initial_capital} onChange={e => setForm({ ...form, initial_capital: Number(e.target.value) })} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#94a3b8' }}>開始日</label>
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#94a3b8' }}>終了日</label>
            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inp} />
          </div>
        </div>
        <button onClick={handleRun} disabled={loading} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 32px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? '実行中...' : 'バックテスト実行'}
        </button>
        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
      </div>

      {result && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'トータルリターン', value: `${result.total_return}%`, color: result.total_return >= 0 ? '#22c55e' : '#ef4444' },
              { label: 'シャープレシオ', value: result.sharpe_ratio },
              { label: '最大ドローダウン', value: `${result.max_drawdown}%`, color: '#ef4444' },
              { label: '勝率', value: `${result.win_rate}%`, color: '#22c55e' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#1e293b', borderRadius: 8, padding: 16 }}>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: s.color ?? '#e2e8f0', marginTop: 4 }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#1e293b', borderRadius: 8, padding: 20, marginBottom: 24 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 12 }}>取引履歴 ({result.total_trades} 取引)</div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: '#94a3b8' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>日付</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>売買</th>
                    <th style={{ textAlign: 'right', padding: '8px 0' }}>価格</th>
                    <th style={{ textAlign: 'right', padding: '8px 0' }}>損益</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>理由</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.map((t: any, i: number) => (
                    <tr key={i} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '6px 0' }}>{t.date}</td>
                      <td style={{ color: t.side === 'BUY' ? '#22c55e' : '#ef4444' }}>{t.side}</td>
                      <td style={{ textAlign: 'right' }}>${t.price?.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: (t.pnl ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>{t.pnl !== undefined ? `$${t.pnl?.toFixed(2)}` : '-'}</td>
                      <td style={{ color: '#64748b', fontSize: 11 }}>{t.reason}</td>
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
}
