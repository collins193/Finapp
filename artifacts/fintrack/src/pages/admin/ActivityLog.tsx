import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shell } from "@/components/layout/Shell";
import { PageTransition } from "@/components/layout/PageTransition";
import { LogIn, UserPlus, TrendingUp, TrendingDown, DollarSign, Banknote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL;

interface ActivityEntry {
  id: number;
  type: "login" | "signup" | "balance_increase" | "balance_decrease" | "balance_set" | "payment_submitted";
  metadata: Record<string, any>;
  createdAt: string;
  userId: number;
  userName: string;
  userEmail: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const typeConfig: Record<
  ActivityEntry["type"],
  { icon: React.ElementType; color: string; dotColor: string; label: (meta: any) => string }
> = {
  login: {
    icon: LogIn,
    color: "text-blue-500",
    dotColor: "bg-blue-500",
    label: () => "logged in",
  },
  signup: {
    icon: UserPlus,
    color: "text-green-500",
    dotColor: "bg-green-500",
    label: () => "created an account",
  },
  balance_increase: {
    icon: TrendingUp,
    color: "text-emerald-500",
    dotColor: "bg-emerald-500",
    label: (meta) =>
      `balance increased by ${formatCurrency(meta?.amount ?? 0)}${meta?.adminName ? ` (admin: ${meta.adminName})` : ""}`,
  },
  balance_decrease: {
    icon: TrendingDown,
    color: "text-red-500",
    dotColor: "bg-red-500",
    label: (meta) =>
      `balance decreased by ${formatCurrency(meta?.amount ?? 0)}${meta?.adminName ? ` (admin: ${meta.adminName})` : ""}`,
  },
  balance_set: {
    icon: DollarSign,
    color: "text-purple-500",
    dotColor: "bg-purple-500",
    label: (meta) =>
      `balance set to ${formatCurrency(meta?.amount ?? 0)}${meta?.adminName ? ` (admin: ${meta.adminName})` : ""}`,
  },
  payment_submitted: {
    icon: Banknote,
    color: "text-cyan-500",
    dotColor: "bg-cyan-500",
    label: (meta) =>
      `submitted a payment of $${meta?.amount ?? 0} via ${meta?.method ?? "unknown"}`,
  },
};

export default function ActivityLog() {
  const { data: activity, isLoading } = useQuery<ActivityEntry[]>({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/admin/activity`, { credentials: "include" });
      if (!r.ok) throw new Error("Unauthorized");
      return r.json();
    },
    refetchInterval: 30000,
  });

  return (
    <Shell>
      <PageTransition>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Log</h1>
              <p className="text-muted-foreground mt-1">Real-time user and system events.</p>
            </div>
            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live · refreshes every 30s
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 w-4 rounded-full bg-slate-200 animate-pulse mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : !activity || activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <LogIn className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No activity yet</p>
              <p className="text-slate-400 text-sm mt-1">Events will appear here as users interact.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline rail */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-100" />

              <motion.div
                className="space-y-0"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.045 } } }}
              >
                {activity.map((entry) => {
                  const cfg = typeConfig[entry.type] ?? typeConfig.login;
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={entry.id}
                      variants={{
                        hidden: { opacity: 0, x: -12 },
                        show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
                      }}
                      className="flex gap-4 py-3"
                    >
                      {/* Icon dot */}
                      <div
                        className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.dotColor} bg-opacity-10`}
                        style={{ background: "white", border: `2px solid` }}
                      >
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* User avatar */}
                          <div className="h-5 w-5 rounded-full bg-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-700 flex-shrink-0">
                            {getInitials(entry.userName)}
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">{entry.userName}</span>
                          <span className="text-slate-600 text-sm">{cfg.label(entry.metadata)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-400">{entry.userEmail}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-400 font-mono">
                            {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}
        </div>
      </PageTransition>
    </Shell>
  );
}
