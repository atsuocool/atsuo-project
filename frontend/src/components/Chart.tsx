import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getOHLCV } from '../api/client';

interface Props { symbol: string; }

export default function Chart({ symbol }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [selectedInterval, setSelectedInterval] = useState('1h');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getOHLCV(symbol || 'BTC-USD', selectedInterval);
        setData(res.data.data.slice(-100));
      } catch {}
    };
    fetchData();
  }, [symbol, selectedInterval]);

  return (
    <div style={{ background: '#1e293b', borderRadius: 8, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontWeight: 'bold' }}>{symbol} チャート</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {['1h', '4h', '1d'].map(i => (
            <button key={i} onClick={() => setSelectedInterval(i)} style={{ background: selectedInterval === i ? '#0ea5e9' : '#334155', color: '#e2e8f0', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>{i.toUpperCase()}</button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v.slice(5, 13)} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
          <Line type="monotone" dataKey="close" stroke="#38bdf8" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
