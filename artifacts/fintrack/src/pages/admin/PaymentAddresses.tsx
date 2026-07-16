import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Shell } from '@/components/layout/Shell';
import { PageTransition } from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  iconBg: string;
}> = {
  btc: {
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin Network',
    icon: '₿',
    iconBg: 'bg-amber-500',
  },
  usdt: {
    name: 'Tether USDT',
    symbol: 'USDT',
    network: 'TRC-20 Network',
    icon: '₮',
    iconBg: 'bg-green-500',
  },
  eth: {
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum Network',
    icon: 'Ξ',
    iconBg: 'bg-indigo-500',
  },
};

const ORDER = ['btc', 'usdt', 'eth'] as const;

export default function PaymentAddresses() {
  const queryClient = useQueryClient();

  const { data: addresses, isLoading } = useQuery<PaymentAddress[]>({
    queryKey: ['payment-addresses'],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/payment-addresses`, { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to fetch payment addresses');
      return r.json();
    },
  });

  const [values, setValues] = useState<Record<string, string>>({ btc: '', usdt: '', eth: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (addresses) {
      const newValues: Record<string, string> = { btc: '', usdt: '', eth: '' };
      for (const a of addresses) {
        const type = a.type.toLowerCase();
        if (type in newValues) {
          newValues[type] = a.address;
        }
      }
      setValues(newValues);
    }
  }, [addresses]);

  const updatedAtMap: Record<string, string> = {};
  if (addresses) {
    for (const a of addresses) {
      updatedAtMap[a.type.toLowerCase()] = a.updatedAt;
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const r = await fetch(`${BASE}api/admin/payment-addresses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          btc: { address: values.btc },
          usdt: { address: values.usdt },
          eth: { address: values.eth },
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ message: 'Failed to save' }));
        throw new Error(err.message || 'Failed to save payment addresses');
      }
      toast.success('Payment addresses saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['payment-addresses'] });
    } catch (e: any) {
      toast.error(e.message || 'Failed to save payment addresses');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Shell>
      <PageTransition>
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Addresses</h1>
            <p className="text-muted-foreground mt-1">
              Configure wallet addresses shown to users for deposits.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {ORDER.map((type) => {
                const cfg = COIN_CONFIG[type];
                const updatedAt = updatedAtMap[type];
                return (
                  <Card key={type}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${cfg.iconBg} flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{cfg.name}</CardTitle>
                          <CardDescription className="text-xs">{cfg.network}</CardDescription>
                        </div>
                        {updatedAt && (
                          <span className="text-xs text-muted-foreground font-mono">
                            Last updated: {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                          Wallet Address
                        </label>
                        <input
                          type="text"
                          value={values[type]}
                          onChange={(e) =>
                            setValues((prev) => ({ ...prev, [type]: e.target.value }))
                          }
                          placeholder={`Enter ${cfg.symbol} wallet address...`}
                          className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all placeholder:text-muted-foreground"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Save button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm rounded-lg transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </Shell>
  );
}
