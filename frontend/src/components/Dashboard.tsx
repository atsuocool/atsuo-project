import React from 'react';
import Chart from './Chart';
import BotControl from './BotControl';
import { BotStatus } from '../api/client';

interface Props {
  botStatus: BotStatus;
}

const StatCard: React.FC<{ title: string; value: string; sub?: string; positive?: boolean }> = ({ title, value, sub, positive }) => (
  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{title}</p>
    <p className={`text-2xl font-bold ${positive === true ? 'text-emerald-400' : positive === false ? 'text-red-400' : 'text-slate-100'}`}>{value}</p>
    {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
  </div>
);

const Dashboard: React.FC<Props> = ({ botStatus }) => {
  const portfolioValue = botStatus.capital + botStatus.pnl;
  const pnlPositive = botStatus.pnl >= 0;

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard title="Portfolio Value" value={`$${portfolioValue.toFixed(2)}`} />
          <StatCard
            title="Total PnL"
            value={`${pnlPositive ? '+' : ''}$${botStatus.pnl.toFixed(2)}`}
            positive={pnlPositive}
          />
          <StatCard title="Win Rate" value="--" sub="No trades yet" />
          <StatCard title="Active Trades" value={botStatus.position > 0 ? '1' : '0'} />
        </div>
        <Chart symbol={botStatus.symbol} />
      </div>
      <div className="w-72">
        <BotControl />
      </div>
    </div>
  );
};

export default Dashboard;
