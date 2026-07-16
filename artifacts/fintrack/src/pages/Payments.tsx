import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Shell } from '@/components/layout/Shell';
import { PageTransition } from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const BASE = import.meta.env.BASE_URL;

interface PaymentAddress {
  id: number;
  type: string;
  address: string;
  label: string;
  updatedAt: string;
}

const COIN_CONFIG: Record<string, {
  name: string;
  symbol: string;
  network: string;
  icon: string;
  gradient: string;
  border: string;
  iconBg: string;
  iconText: string;
}> = {
  btc: {
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin Network',
    icon: '₿',
    gradient: 'from-amber-500/10 to-orange-500/5',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500',
    iconText: 'text-white',
  },
  usdt: {
    name: 'Tether USDT',
    symbol: 'USDT',
    network: 'TRC-20 Network',
    icon: '₮',
    gradient: 'from-green-500/10 to-emerald-500/5',
    border: 'border-green-500/30',
    iconBg: 'bg-green-500',
    iconText: 'text-white',
  },
  eth: {
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum Network',
    icon: 'Ξ',
    gradient: 'from-indigo-500/10 to-purple-500/5',
    border: 'border-indigo-500/30',
    iconBg: 'bg-indigo-500',
    iconText: 'text-white',
  },
};

const ORDER = ['btc', 'usdt', 'eth'];

function shortenAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

function CopyButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-muted text-foreground hover:bg-muted/80'
      }`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy Address
        </>
      )}
    </button>
  );
}

function PaymentCard({ type, address }: { type: string; address?: string }) {
  const cfg = COIN_CONFIG[type];

  if (!cfg) return null;

  return (
    <Card className={`bg-gradient-to-br ${cfg.gradient} border ${cfg.border} overflow-hidden`}>
      <CardContent className="pt-6 pb-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-full ${cfg.iconBg} flex items-center justify-center text-xl font-bold ${cfg.iconText} flex-shrink-0`}>
            {cfg.icon}
          </div>
          <div>
            <p className="font-semibold text-foreground">{cfg.name}</p>
            <p className="text-xs text-muted-foreground">{cfg.network}</p>
          </div>
          <span className="ml-auto text-xs font-mono font-medium bg-muted px-2 py-1 rounded text-muted-foreground">
            {cfg.symbol}
          </span>
        </div>

        {address ? (
          <>
            {/* Address block */}
            <div className="bg-muted/60 rounded-lg p-3 border border-border/50">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Wallet Address</p>
              <p className="font-mono text-xs text-foreground break-all leading-relaxed">{address}</p>
            </div>

            {/* QR placeholder */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-5 gap-2">
              <div className="grid grid-cols-5 gap-1 opacity-40">
                {[...Array(25)].map((_, i) => (
                  <div
                    key={i}
                    className="h-3 w-3 rounded-sm bg-foreground"
                    style={{ opacity: Math.random() > 0.5 ? 1 : 0.2 }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {shortenAddress(address)}
              </p>
            </div>

            {/* Copy button */}
            <CopyButton address={address} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-xl text-muted-foreground">{cfg.icon}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Address not configured</p>
            <p className="text-xs text-muted-foreground mt-1">Contact an admin to set up this payment method.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function Payments() {
  const { data: addresses, isLoading } = useQuery<PaymentAddress[]>({
    queryKey: ['payment-addresses'],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/payment-addresses`, { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to fetch payment addresses');
      return r.json();
    },
  });

  const addressMap: Record<string, string> = {};
  if (addresses) {
    for (const a of addresses) {
      addressMap[a.type.toLowerCase()] = a.address;
    }
  }

  return (
    <Shell>
      <PageTransition>
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Deposit Funds</h1>
            <p className="text-muted-foreground mt-1">
              Send crypto to one of the addresses below to fund your account. Contact support after depositing.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {ORDER.map((type) => (
                <motion.div key={type} variants={itemVariants}>
                  <PaymentCard type={type} address={addressMap[type]} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Note */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <strong>Important:</strong> Only send the matching cryptocurrency to each address. Sending the wrong coin may result in permanent loss of funds.
          </div>
        </div>
      </PageTransition>
    </Shell>
  );
}
