import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'wouter';
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
  selectedBorder: string;
  iconBg: string;
  iconText: string;
  accentText: string;
}> = {
  btc: {
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin Network',
    icon: '₿',
    gradient: 'from-amber-500/10 to-orange-500/5',
    border: 'border-amber-500/20',
    selectedBorder: 'border-amber-500',
    iconBg: 'bg-amber-500',
    iconText: 'text-white',
    accentText: 'text-amber-500',
  },
  usdt: {
    name: 'Tether USDT',
    symbol: 'USDT',
    network: 'TRC-20 Network',
    icon: '₮',
    gradient: 'from-green-500/10 to-emerald-500/5',
    border: 'border-green-500/20',
    selectedBorder: 'border-green-500',
    iconBg: 'bg-green-500',
    iconText: 'text-white',
    accentText: 'text-green-500',
  },
  eth: {
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum Network',
    icon: 'Ξ',
    gradient: 'from-indigo-500/10 to-purple-500/5',
    border: 'border-indigo-500/20',
    selectedBorder: 'border-indigo-500',
    iconBg: 'bg-indigo-500',
    iconText: 'text-white',
    accentText: 'text-indigo-500',
  },
};

const ORDER = ['btc', 'usdt', 'eth'] as const;
type Method = typeof ORDER[number];

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

const slideVariants = {
  enterForward: { x: 60, opacity: 0 },
  enterBackward: { x: -60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitForward: { x: -60, opacity: 0 },
  exitBackward: { x: 60, opacity: 0 },
};

export default function Payments() {
  const [step, setStep] = useState<'amount' | 'payment' | 'confirmed'>('amount');
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

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

  const goForward = (next: typeof step) => {
    setDirection('forward');
    setStep(next);
  };

  const goBackward = (prev: typeof step) => {
    setDirection('backward');
    setStep(prev);
  };

  const handleSubmit = async () => {
    if (!selectedMethod || !selectedAmount) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/payments/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: selectedAmount, method: selectedMethod }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Submission failed' }));
        throw new Error(err.message || 'Submission failed');
      }
      setSubmittedAt(new Date());
      goForward('confirmed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setDirection('backward');
    setStep('amount');
    setSelectedAmount('');
    setSelectedMethod(null);
    setSubmittedAt(null);
  };

  const amountNum = parseFloat(selectedAmount);
  const canContinue = amountNum > 0 && selectedMethod !== null;
  const walletAddress = selectedMethod ? (addressMap[selectedMethod] ?? '') : '';
  const methodCfg = selectedMethod ? COIN_CONFIG[selectedMethod] : null;

  return (
    <Shell>
      <PageTransition>
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Deposit Funds</h1>
            <p className="text-muted-foreground mt-1">
              Fund your account securely with cryptocurrency.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm">
            {(['amount', 'payment', 'confirmed'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s
                      ? 'bg-green-500 text-white'
                      : i < (['amount', 'payment', 'confirmed'] as const).indexOf(step)
                      ? 'bg-green-500/30 text-green-600'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < (['amount', 'payment', 'confirmed'] as const).indexOf(step) ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`capitalize ${
                    step === s ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {s === 'confirmed' ? 'Confirmed' : s === 'payment' ? 'Payment' : 'Amount'}
                </span>
                {i < 2 && <div className="w-8 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {/* Step 1: Amount Entry */}
              {step === 'amount' && (
                <motion.div
                  key="amount"
                  initial={direction === 'forward' ? slideVariants.enterForward : slideVariants.enterBackward}
                  animate={slideVariants.center}
                  exit={direction === 'forward' ? slideVariants.exitForward : slideVariants.exitBackward}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="max-w-lg mx-auto">
                    <Card>
                      <CardContent className="pt-8 pb-8 flex flex-col gap-6">
                        <div className="text-center">
                          <h2 className="text-xl font-semibold text-foreground">How much would you like to deposit?</h2>
                          <p className="text-sm text-muted-foreground mt-1">Select an amount and payment method to continue.</p>
                        </div>

                        {/* Amount input */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-foreground">Amount (USD)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-lg">$</span>
                            <input
                              type="number"
                              min={1}
                              step="0.01"
                              value={selectedAmount}
                              onChange={(e) => setSelectedAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full h-14 bg-muted border border-border rounded-lg pl-8 pr-4 text-2xl font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                            />
                          </div>
                        </div>

                        {/* Method selection */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-foreground">Payment Method</label>
                          {isLoading ? (
                            <div className="flex flex-col gap-2">
                              {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-lg" />
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {ORDER.map((type) => {
                                const cfg = COIN_CONFIG[type];
                                const isSelected = selectedMethod === type;
                                return (
                                  <button
                                    key={type}
                                    onClick={() => setSelectedMethod(type)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left bg-gradient-to-br ${cfg.gradient} ${
                                      isSelected ? cfg.selectedBorder : cfg.border
                                    }`}
                                  >
                                    <div className={`h-10 w-10 rounded-full ${cfg.iconBg} flex items-center justify-center text-lg font-bold ${cfg.iconText} flex-shrink-0`}>
                                      {cfg.icon}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-semibold text-foreground text-sm">{cfg.name}</p>
                                      <p className="text-xs text-muted-foreground">{cfg.network}</p>
                                    </div>
                                    <span className={`text-xs font-mono font-bold ${cfg.accentText}`}>{cfg.symbol}</span>
                                    {isSelected && (
                                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3 w-3 text-white" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Continue button */}
                        <button
                          onClick={() => goForward('payment')}
                          disabled={!canContinue}
                          className="w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600 text-white"
                        >
                          Continue to Payment
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment Instructions */}
              {step === 'payment' && selectedMethod && methodCfg && (
                <motion.div
                  key="payment"
                  initial={direction === 'forward' ? slideVariants.enterForward : slideVariants.enterBackward}
                  animate={slideVariants.center}
                  exit={direction === 'forward' ? slideVariants.exitForward : slideVariants.exitBackward}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="max-w-lg mx-auto">
                    <Card className={`bg-gradient-to-br ${methodCfg.gradient} border-2 ${methodCfg.selectedBorder}`}>
                      <CardContent className="pt-8 pb-8 flex flex-col gap-6">
                        {/* Method header */}
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-full ${methodCfg.iconBg} flex items-center justify-center text-2xl font-bold ${methodCfg.iconText} flex-shrink-0`}>
                            {methodCfg.icon}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-lg">{methodCfg.name}</p>
                            <p className="text-sm text-muted-foreground">{methodCfg.network}</p>
                          </div>
                          <span className={`ml-auto text-sm font-mono font-bold ${methodCfg.accentText} bg-muted px-2 py-1 rounded`}>{methodCfg.symbol}</span>
                        </div>

                        {/* Amount to send */}
                        <div className="text-center py-2">
                          <p className="text-sm text-muted-foreground mb-1">Send exactly</p>
                          <p className="text-3xl font-bold text-foreground font-mono">
                            ${parseFloat(selectedAmount).toFixed(2)} <span className={`text-xl ${methodCfg.accentText}`}>worth of {methodCfg.symbol}</span>
                          </p>
                        </div>

                        {/* Wallet address */}
                        {walletAddress ? (
                          <>
                            <div className="bg-muted/60 rounded-lg p-3 border border-border/50">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Wallet Address</p>
                              <p className="font-mono text-xs text-foreground break-all leading-relaxed">{walletAddress}</p>
                            </div>

                            {/* QR placeholder */}
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 gap-2">
                              <div className={`h-16 w-16 rounded-full ${methodCfg.iconBg} flex items-center justify-center text-3xl font-bold ${methodCfg.iconText}`}>
                                {methodCfg.icon}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono mt-1">
                                {walletAddress.length > 16
                                  ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`
                                  : walletAddress}
                              </p>
                            </div>

                            <CopyButton address={walletAddress} />
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <p className="text-sm font-medium text-muted-foreground">Address not configured</p>
                            <p className="text-xs text-muted-foreground mt-1">Contact an admin to set up this payment method.</p>
                          </div>
                        )}

                        {/* Notice */}
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                          <strong>Important:</strong> Only send {methodCfg.symbol}. Do not send other tokens to this address.
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => goBackward('amount')}
                            className="flex-1 h-11 rounded-lg border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors text-foreground"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Change Method
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 h-11 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : (
                              <>
                                I've Sent the Payment
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirmed */}
              {step === 'confirmed' && methodCfg && (
                <motion.div
                  key="confirmed"
                  initial={direction === 'forward' ? slideVariants.enterForward : slideVariants.enterBackward}
                  animate={slideVariants.center}
                  exit={direction === 'forward' ? slideVariants.exitForward : slideVariants.exitBackward}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="max-w-lg mx-auto">
                    <Card>
                      <CardContent className="pt-10 pb-10 flex flex-col items-center gap-6 text-center">
                        {/* Animated checkmark */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
                        >
                          <CheckCircle2 className="h-20 w-20 text-green-500" />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25, duration: 0.3 }}
                          className="flex flex-col gap-2"
                        >
                          <h2 className="text-2xl font-bold text-foreground">Payment Submitted!</h2>
                          <p className="text-base font-medium text-muted-foreground">
                            Pending... Your balance will reflect within 6 hours.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Our team has been notified and will verify your payment shortly.
                          </p>
                        </motion.div>

                        {/* Details */}
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35, duration: 0.3 }}
                          className="w-full rounded-lg bg-muted/60 border border-border p-4 flex flex-col gap-3 text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="font-mono font-bold text-foreground">${parseFloat(selectedAmount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Method</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${methodCfg.accentText}`}>{methodCfg.icon}</span>
                              <span className="font-medium text-foreground">{methodCfg.name} ({methodCfg.symbol})</span>
                            </div>
                          </div>
                          {submittedAt && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Submitted at</span>
                              <span className="font-mono text-foreground text-xs">
                                {submittedAt.toLocaleDateString()} {submittedAt.toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </motion.div>

                        {/* Action buttons */}
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45, duration: 0.3 }}
                          className="flex flex-col gap-3 w-full"
                        >
                          <Link href="/dashboard">
                            <button className="w-full h-11 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors">
                              Back to Dashboard
                            </button>
                          </Link>
                          <button
                            onClick={resetFlow}
                            className="w-full h-11 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors text-foreground"
                          >
                            Make another deposit
                          </button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </PageTransition>
    </Shell>
  );
}
