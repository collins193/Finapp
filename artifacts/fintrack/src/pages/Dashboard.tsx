import { Shell } from "@/components/layout/Shell";
import { PageTransition } from "@/components/layout/PageTransition";
import {
  useGetDashboardSummary,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
// ActivityItem type inline
interface ActivityItem { id: number; description: string; timestamp: string; meta?: string; };
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";
import { useEffect } from "react";
import { Link } from "wouter";
import { TrendingUp, CreditCard } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface PaymentAddress {
  id: number;
  type: string;
  address: string;
  label: string;
  updatedAt: string;
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 120, damping: 25 });
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v).toLocaleString()}`);

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span>{display}</motion.span>;
}

function AnimatedCurrency({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 100, damping: 22 });
  const display = useTransform(spring, (v) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)
  );

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span>{display}</motion.span>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
};

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: ["dashboard-summary"] },
  });

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ["my-activity"],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/dashboard/my-activity`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json() as Promise<ActivityItem[]>;
    },
    refetchInterval: 15000,
  });

  const { data: paymentAddresses, isLoading: loadingPayments } = useQuery<PaymentAddress[]>({
    queryKey: ["payment-addresses"],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/payment-addresses`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { user } = useAuth();

  const configuredPayments = paymentAddresses?.filter((a) => a.address && a.address.trim() !== "").length ?? 0;

  return (
    <Shell>
      <PageTransition>
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
              <p className="text-muted-foreground mt-1">Your portfolio overview and live market data.</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* My Balance / Portfolios */}
            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="show">
              {user?.role === "user" ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      My Balance
                    </CardDescription>
                    <CardTitle className="text-3xl font-bold text-green-600 font-mono">
                      <AnimatedCurrency value={user.balance ?? 0} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Account balance</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Portfolios
                    </CardDescription>
                    <CardTitle className="text-3xl font-bold">
                      {loadingSummary ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <AnimatedNumber value={summary?.portfolioCount ?? 0} />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Managed accounts</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Crypto */}
            <motion.div custom={1} variants={cardVariants} initial="hidden" animate="show">
              <Link href="/crypto">
                <Card className="cursor-pointer hover:border-green-400/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Crypto Market
                    </CardDescription>
                    <CardTitle className="text-3xl font-bold text-green-600">
                      12
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-sm text-muted-foreground">Live Prices</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            {/* Payments */}
            <motion.div custom={2} variants={cardVariants} initial="hidden" animate="show">
              <Link href="/payments">
                <Card className="cursor-pointer hover:border-blue-400/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      Payments
                    </CardDescription>
                    <CardTitle className="text-3xl font-bold">
                      {loadingPayments ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <AnimatedNumber value={configuredPayments} />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Configured methods</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </div>

          {/* Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest portfolio &amp; project actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {loadingActivity ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-2 w-2 rounded-full mt-2" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))
                  ) : !activity || (activity as ActivityItem[]).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  ) : (
                    (activity as ActivityItem[]).map((item) => (
                      <div key={item.id} className="flex gap-3 items-start group">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-accent/50 group-hover:bg-accent transition-colors" />
                        <div>
                          <p className="text-sm text-foreground leading-tight">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                            </span>
                            {item.meta && (
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                {item.meta}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    </Shell>
  );
}
