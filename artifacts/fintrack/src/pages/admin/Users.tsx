import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Shell } from "@/components/layout/Shell";
import { PageTransition } from "@/components/layout/PageTransition";
import { Minus, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const BASE = import.meta.env.BASE_URL;

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  balance: number;
  createdAt: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-indigo-500",
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

async function patchBalance(
  userId: number,
  action: "set" | "increase" | "decrease",
  amount: number
) {
  const r = await fetch(`${BASE}api/admin/users/${userId}/balance`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, amount }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ message: "Failed" }));
    throw new Error(err.message || "Failed to update balance");
  }
}

function BalanceControl({
  user,
  onSuccess,
}: {
  user: AdminUser;
  onSuccess: () => void;
}) {
  const [decreaseAmt, setDecreaseAmt] = useState("");
  const [increaseAmt, setIncreaseAmt] = useState("");
  const [setDialogOpen, setSetDialogOpen] = useState(false);
  const [setAmt, setSetAmt] = useState("");
  const [decOpen, setDecOpen] = useState(false);
  const [incOpen, setIncOpen] = useState(false);

  const handle = async (
    action: "set" | "increase" | "decrease",
    rawAmt: string
  ) => {
    const amount = parseFloat(rawAmt);
    if (isNaN(amount) || amount < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await patchBalance(user.id, action, amount);
      toast.success(
        `Balance ${action === "set" ? "set to" : action === "increase" ? "increased by" : "decreased by"} ${formatCurrency(amount)}`
      );
      onSuccess();
      setDecOpen(false);
      setIncOpen(false);
      setSetDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Decrease */}
      <Popover open={decOpen} onOpenChange={setDecOpen}>
        <PopoverTrigger asChild>
          <button className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors">
            <Minus className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="end">
          <p className="text-xs font-medium text-slate-600 mb-2">Decrease by</p>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={decreaseAmt}
              onChange={(e) => setDecreaseAmt(e.target.value)}
              placeholder="0.00"
              className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              onClick={() => handle("decrease", decreaseAmt)}
              className="px-2 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-700"
            >
              OK
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Increase */}
      <Popover open={incOpen} onOpenChange={setIncOpen}>
        <PopoverTrigger asChild>
          <button className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-green-600 hover:border-green-200 transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="end">
          <p className="text-xs font-medium text-slate-600 mb-2">Increase by</p>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={increaseAmt}
              onChange={(e) => setIncreaseAmt(e.target.value)}
              placeholder="0.00"
              className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              onClick={() => handle("increase", increaseAmt)}
              className="px-2 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-700"
            >
              OK
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Set exact */}
      <button
        onClick={() => {
          setSetAmt(user.balance.toString());
          setSetDialogOpen(true);
        }}
        className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <Dialog open={setDialogOpen} onOpenChange={setSetDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Set Balance for {user.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-sm text-slate-600 block mb-1">New Balance</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={setAmt}
                onChange={(e) => setSetAmt(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <button
              onClick={() => handle("set", setAmt)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Set Balance
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/admin/users`, { credentials: "include" });
      if (!r.ok) throw new Error("Unauthorized");
      return r.json();
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  return (
    <Shell>
      <PageTransition>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                User Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage accounts and balances.
              </p>
            </div>
            {users && (
              <span className="bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-full border border-slate-200">
                {users.length} {users.length === 1 ? "user" : "users"}
              </span>
            )}
          </div>

          {/* User rows */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-white border border-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : users?.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No users found.</div>
          ) : (
            <motion.div
              className="space-y-3"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {users?.map((user) => (
                <motion.div
                  key={user.id}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
                  }}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div
                    className={`h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor(user.id)}`}
                  >
                    {getInitials(user.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{user.name}</span>
                      {user.role === "admin" ? (
                        <span className="bg-amber-100 text-amber-800 text-xs rounded-full px-2 py-0.5 font-medium">
                          admin
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5 font-medium">
                          user
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</p>
                  </div>

                  {/* Balance */}
                  <div className="text-right mr-4">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={user.balance}
                        initial={{ scale: 1.15, color: "#16a34a" }}
                        animate={{ scale: 1, color: "#16a34a" }}
                        transition={{ duration: 0.3 }}
                        className="text-xl font-bold font-mono text-green-600 block"
                      >
                        {formatCurrency(user.balance)}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Balance</span>
                  </div>

                  {/* Controls */}
                  <BalanceControl user={user} onSuccess={invalidate} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </PageTransition>
    </Shell>
  );
}
