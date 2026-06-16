import React, { useEffect, useState } from 'react';
import { getBotStatus, getTrades } from '../api/client';
import BotControl from './BotControl';
import Chart from './Chart';
import Portfolio from './Portfolio';

interface BotStatus {
  running: boolean;
  strategy: string;
  symbol: string;
  current_price: number;
  position: number;
  capital: number;
  portfolio_value: number;
  pnl: number;
}

export default function Dashboard() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, t] = await Promise.all([getBotStatus(), getTrades()]);
        setStatus(s.data);
        setTrades(t.data.trades);
      } catch {}
    };
    fetch();
    const id = setInterval(fetch, 5000);
    return () => clearInterval(id);
  }, []);

  const card = (label: string, value: string, color = '#e2e8f0') => (
    <div style={{ background: '#1e293b', borderRadius: 8, padding: 20, flex: 1 }}>
      <div style={{ color: '#94a3b8', fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold', color, marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', borderRadius: 8, padding: '8px 16px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: status?.running ? '#22c55e' : '#ef4444' }} />
          <span style={{ color: '#94a3b8' }}>{status?.running ? '稼働中' : '停止中'}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {card('ポートフォリオ価値', `$${status?.portfolio_value?.toFixed(2) ?? '0.00'}`)}
        {card('損益 (PnL)', `$${status?.pnl?.toFixed(2) ?? '0.00'}`, (status?.pnl ?? 0) >= 0 ? '#22c55e' : '#ef4444')}
        {card('現在価格', `$${status?.current_price?.toFixed(2) ?? '0.00'}`)}
        {card('ポジション', status?.position ? `${status.position.toFixed(6)} BTC` : 'なし')}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 2 }}>
          <Chart symbol={status?.symbol ?? 'BTC-USD'} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BotControl onUpdate={() => {}} />
          <Portfolio trades={trades} pnl={status?.pnl ?? 0} />
        </div>
      </div>
    </div>
  );
}
