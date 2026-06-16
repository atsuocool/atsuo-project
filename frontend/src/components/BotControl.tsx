import React, { useState } from 'react';
import { startBot, stopBot, getBotStatus } from '../api/client';

interface Props { onUpdate: () => void; }

export default function BotControl({ onUpdate }: Props) {
  const [strategy, setStrategy] = useState('ma_cross');
  const [symbol, setSymbol] = useState('BTC-USD');
  const [capital, setCapital] = useState(1000);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState('');

  const strategies = [
    { value: 'ma_cross', label: 'MA クロス' },
    { value: 'rsi_bb', label: 'RSI + BB' },
    { value: 'macd', label: 'MACD' },
  ];

  const handleStart = async () => {
    try {
      await startBot({ strategy, symbol, capital });
      setRunning(true);
      setMsg('Bot 開始しました');
      onUpdate();
    } catch { setMsg('エラーが発生しました'); }
  };

  const handleStop = async () => {
    try {
      await stopBot();
      setRunning(false);
      setMsg('Bot 停止しました');
      onUpdate();
    } catch { setMsg('エラーが発生しました'); }
  };

  const inp = { background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', width: '100%' };

  return (
    <div style={{ background: '#1e293b', borderRadius: 8, padding: 20 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 16 }}>Bot コントロール</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: '#94a3b8' }}>戦略</label>
          <select value={strategy} onChange={e => setStrategy(e.target.value)} style={inp}>
            {strategies.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#94a3b8' }}>シンボル</label>
          <input value={symbol} onChange={e => setSymbol(e.target.value)} style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#94a3b8' }}>資金 (USD)</label>
          <input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} style={inp} />
        </div>
        <button onClick={running ? handleStop : handleStart} style={{ background: running ? '#ef4444' : '#22c55e', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
          {running ? '停止' : '開始'}
        </button>
        {msg && <div style={{ color: '#94a3b8', fontSize: 12 }}>{msg}</div>}
      </div>
    </div>
  );
}
