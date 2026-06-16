import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { botApi, Trade, BotStatus } from '../api/client';

interface Props {
  botStatus: BotStatus;
}

const Portfolio: React.FC<Props> = ({ botStatus }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [pnlHistory, setPnlHistory] = useState<Array<{ time: string; value: number }>>([]);

  const fetchTrades = async () => {
    try {
      const res = await botApi.trades();
      setTrades(res.data);
      let cumPnl = 0;
      const curve = res.data.map(t => {
        cumPnl += t.pnl ?? 0;
        return { time: new Date(t.timestamp).toLocaleDateString(), value: cumPnl };
      });
      setPnlHistory(curve);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const portfolioValue = botStatus.capital + botStatus.pnl;

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Portfolio</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Portfolio Value</p>
          <p className="text-2xl font-bold">${portfolioValue.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Unrealized PnL</p>
          <p className={`text-2xl font-bold ${botStatus.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {botStatus.pnl >= 0 ? '+' : ''}${botStatus.pnl.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Position</p>
          <p className="text-2xl font-bold">{botStatus.position > 0 ? `${botStatus.position.toFixed(6)} ${botStatus.symbol.split('/')[0]}` : 'None'}</p>
          {botStatus.entry_price && <p className="text-xs text-slate-500 mt-1">Entry: ${botStatus.entry_price.toLocaleString()}</p>}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h2 className="font-semibold text-slate-200 mb-4">Cumulative PnL</h2>
        {pnlHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={pnlHistory}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'PnL']}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#pnlGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-500 text-sm">No trade history yet</div>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h2 className="font-semibold text-slate-200 mb-3">Trade History ({trades.length})</h2>
        {trades.length === 0 ? (
          <p className="text-slate-500 text-sm">No trades yet. Start the bot to begin paper trading.</p>
        ) : (
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 pr-4">Time</th>
                  <th className="text-left py-2 pr-4">Symbol</th>
                  <th className="text-left py-2 pr-4">Side</th>
                  <th className="text-right py-2 pr-4">Price</th>
                  <th className="text-right py-2 pr-4">Qty</th>
                  <th className="text-right py-2">PnL</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-1.5 pr-4 text-slate-400">{new Date(t.timestamp).toLocaleString()}</td>
                    <td className="py-1.5 pr-4">{t.symbol}</td>
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
        )}
      </div>
    </div>
  );
};

export default Portfolio;
