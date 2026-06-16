import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props { trades: any[]; pnl: number; }

export default function Portfolio({ trades, pnl }: Props) {
  const sellTrades = trades.filter(t => t.side === 'SELL');
  let cumPnl = 0;
  const pnlData = sellTrades.map(t => { cumPnl += t.pnl ?? 0; return { time: t.time?.slice(0, 10), pnl: cumPnl }; });

  return (
    <div style={{ background: '#1e293b', borderRadius: 8, padding: 20 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 12 }}>損益履歴</div>
      {pnlData.length > 0 ? (
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={pnlData}>
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
            <Area type="monotone" dataKey="pnl" stroke={pnl >= 0 ? '#22c55e' : '#ef4444'} fill={pnl >= 0 ? '#16a34a33' : '#dc262633'} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ color: '#64748b', fontSize: 13 }}>取引履歴なし</div>
      )}
      <div style={{ marginTop: 12 }}>
        {trades.slice(-5).reverse().map((t, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #334155', fontSize: 12 }}>
            <span style={{ color: t.side === 'BUY' ? '#22c55e' : '#ef4444' }}>{t.side}</span>
            <span>${t.price?.toFixed(2)}</span>
            {t.pnl !== undefined && <span style={{ color: t.pnl >= 0 ? '#22c55e' : '#ef4444' }}>${t.pnl?.toFixed(2)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
