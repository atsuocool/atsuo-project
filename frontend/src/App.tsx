import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Backtest from './components/Backtest';

export default function App() {
  const [tab, setTab] = useState<'dashboard' | 'backtest'>('dashboard');

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <nav style={{ background: '#1e293b', padding: '12px 24px', display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <span style={{ fontWeight: 'bold', fontSize: 18, color: '#38bdf8' }}>TradingBot</span>
        <button onClick={() => setTab('dashboard')} style={{ background: tab === 'dashboard' ? '#0ea5e9' : 'transparent', color: '#e2e8f0', border: 'none', padding: '6px 16px', borderRadius: 6, cursor: 'pointer' }}>ダッシュボード</button>
        <button onClick={() => setTab('backtest')} style={{ background: tab === 'backtest' ? '#0ea5e9' : 'transparent', color: '#e2e8f0', border: 'none', padding: '6px 16px', borderRadius: 6, cursor: 'pointer' }}>バックテスト</button>
      </nav>
      <main style={{ padding: 24 }}>
        {tab === 'dashboard' ? <Dashboard /> : <Backtest />}
      </main>
    </div>
  );
}
