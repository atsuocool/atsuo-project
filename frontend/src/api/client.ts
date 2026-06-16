import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000' });

export const getPrice = (symbol: string) => api.get(`/api/market/price/${symbol}`);
export const getOHLCV = (symbol: string, interval = '1h') => api.get(`/api/market/ohlcv/${symbol}?interval=${interval}`);
export const startBot = (data: { strategy: string; symbol: string; capital: number }) => api.post('/api/bot/start', data);
export const stopBot = () => api.post('/api/bot/stop');
export const getBotStatus = () => api.get('/api/bot/status');
export const getTrades = () => api.get('/api/bot/trades');
export const runBacktest = (data: { symbol: string; strategy: string; start_date: string; end_date: string; initial_capital: number }) => api.post('/api/backtest/run', data);
