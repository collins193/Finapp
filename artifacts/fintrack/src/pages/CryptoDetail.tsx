import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Shell } from '@/components/layout/Shell';
import { PageTransition } from '@/components/layout/PageTransition';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BASE = import.meta.env.BASE_URL;

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

interface ChartPoint {
  time: string;
  price: number;
}

type DayRange = '1' | '7' | '30' | '90';

function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

const DAY_OPTIONS: { label: string; value: DayRange }[] = [
  { label: '1D', value: '1' },
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
];

export default function CryptoDetail() {
  const { coinId } = useParams<{ coinId: string }>();
  const [, navigate] = useLocation();
  const [days, setDays] = useState<DayRange>('7');

  const { data: coins } = useQuery<CoinData[]>({
    queryKey: ['crypto-coins'],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/crypto/coins`, { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to fetch coins');
      return r.json();
    },
    refetchInterval: 15000,
  });

  const coin = coins?.find((c) => c.id === coinId);

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartPoint[]>({
    queryKey: ['crypto-chart', coinId, days],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/crypto/${coinId}/chart?days=${days}`, {
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Failed to fetch chart');
      const json: { prices: [number, number][] } = await r.json();
      return json.prices.map(([timestamp, price]) => ({
        time: format(new Date(timestamp), days === '1' ? 'HH:mm' : 'MMM d'),
        price,
      }));
    },
    refetchInterval: 15000,
  });

  const positive = (coin?.price_change_percentage_24h ?? 0) >= 0;

  return (
    <Shell>
      <PageTransition>
        <div className="flex flex-col gap-6">
          {/* Back button */}
          <button
            onClick={() => navigate('/crypto')}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Crypto Market
          </button>

          {/* Header */}
          {coin ? (
            <div className="flex items-center gap-4">
              <img
                src={coin.image}
                alt={coin.name}
                className="h-12 w-12 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">{coin.name}</h1>
                  <span className="text-xs font-mono font-medium uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">
                    {coin.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-bold font-mono text-green-500">
                    ${coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <span className={`flex items-center gap-1 text-sm font-medium ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {positive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}% 24h
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          )}

          {/* Chart Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Price Chart</CardTitle>
                {/* Day range selector */}
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                  {DAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDays(opt.value)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        days === opt.value
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : !chartData || chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  No chart data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v >= 1000
                          ? `$${(v / 1000).toFixed(1)}k`
                          : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 4 })}`
                      }
                      width={72}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#f1f5f9',
                      }}
                      formatter={(value: number) => [
                        `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`,
                        'Price',
                      ]}
                      labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#priceGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Stats grid */}
          {coin && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
            >
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Market Cap</p>
                  <p className="text-xl font-bold font-mono text-foreground">{formatMarketCap(coin.market_cap)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">24h Volume</p>
                  <p className="text-xl font-bold font-mono text-foreground">{formatMarketCap(coin.total_volume)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">24h Change</p>
                  <p className={`text-xl font-bold font-mono ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {positive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </PageTransition>
    </Shell>
  );
}
