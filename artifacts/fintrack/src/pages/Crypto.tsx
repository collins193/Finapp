import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Shell } from '@/components/layout/Shell';
import { PageTransition } from '@/components/layout/PageTransition';
import { Skeleton } from '@/components/ui/skeleton';

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

function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function formatVolume(value: number): string {
  return formatMarketCap(value);
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function Crypto() {
  const [, navigate] = useLocation();

  const { data: coins, isLoading } = useQuery<CoinData[]>({
    queryKey: ['crypto-coins'],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/crypto/coins`, { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to fetch crypto data');
      return r.json();
    },
    refetchInterval: 30000,
  });

  return (
    <Shell>
      <PageTransition>
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Crypto Market</h1>
              <p className="text-muted-foreground mt-1">Live cryptocurrency prices and market data.</p>
            </div>
            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live · auto-refresh 30s
            </span>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !coins || coins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <RefreshCw className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No market data available</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {coins.map((coin) => {
                const positive = coin.price_change_percentage_24h >= 0;
                return (
                  <motion.div
                    key={coin.id}
                    variants={cardVariants}
                    onClick={() => navigate(`/crypto/${coin.id}`)}
                    className="group rounded-xl border bg-card p-5 cursor-pointer hover:border-green-400/50 hover:shadow-md transition-all duration-200"
                  >
                    {/* Coin header */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div>
                        <p className="font-semibold text-foreground text-sm leading-tight">{coin.name}</p>
                        <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {coin.symbol}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <p className="text-2xl font-bold font-mono text-green-500 tracking-tight">
                        ${coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </p>
                    </div>

                    {/* 24h change */}
                    <div className={`flex items-center gap-1 mb-4 text-sm font-medium ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                      {positive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>
                        {positive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                      </span>
                      <span className="text-muted-foreground font-normal text-xs ml-1">24h</span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-0.5">Market Cap</p>
                        <p className="text-sm font-semibold text-foreground">{formatMarketCap(coin.market_cap)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-0.5">24h Volume</p>
                        <p className="text-sm font-semibold text-foreground">{formatVolume(coin.total_volume)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </PageTransition>
    </Shell>
  );
}
