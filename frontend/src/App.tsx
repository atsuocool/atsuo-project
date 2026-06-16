import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Backtest from './components/Backtest';
import Portfolio from './components/Portfolio';
import { BotStatus, createWebSocket } from './api/client';

type Tab = 'dashboard' | 'backtest' | 'portfolio';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [botStatus, setBotStatus] = useState<BotStatus>({
    running: false,
    strategy: 'MACross',
    symbol: 'BTC/USDT',
    position: 0,
    entry_price: null,
    capital: 10000,
    pnl: 0,
    current_price: 0,
  });

  useEffect(() => {
    const ws = createWebSocket((data) => setBotStatus(data));
    return () => ws.close();
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'backtest', label: 'Backtest' },
    { id: 'portfolio', label: 'Portfolio' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-emerald-400">CryptoBot</span>
          <span className="text-slate-400 text-sm">MVP</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${botStatus.running ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-sm text-slate-300">{botStatus.running ? 'Bot Running' : 'Bot Stopped'}</span>
          </div>
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
      <main className="p-6">
        {activeTab === 'dashboard' && <Dashboard botStatus={botStatus} />}
        {activeTab === 'backtest' && <Backtest />}
        {activeTab === 'portfolio' && <Portfolio botStatus={botStatus} />}
      </main>
    </div>
  );
};

export default App;
