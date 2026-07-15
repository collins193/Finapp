import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Activity,
  Briefcase,
  LayoutDashboard,
  PieChart,
  Users,
  LogOut,
  Users2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const } },
};

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const auth = useAuth();

  const baseNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Portfolios", href: "/portfolios", icon: PieChart },
    { label: "Projects", href: "/projects", icon: Briefcase },
    { label: "Tasks", href: "/tasks", icon: Activity },
    { label: "Members", href: "/members", icon: Users },
  ];

  const adminNavItems = [
    { label: "Users", href: "/admin", icon: Users2 },
    { label: "Activity Log", href: "/admin/activity", icon: Activity },
  ];

  const isAdmin = auth.user?.role === "admin";

  const isActive = (href: string) => {
    if (href === "/dashboard") return location === "/dashboard" || location === "/";
    return location === href || (href !== "/" && location.startsWith(href));
  };

  const handleLogout = async () => {
    await auth.logout();
    setLocation("/login");
  };

  const userInitials = auth.user?.name
    ? auth.user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: "#0f172a", borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-green-500 flex items-center justify-center shadow">
              <span className="font-bold text-white font-mono text-sm">FT</span>
            </div>
            <span className="font-semibold tracking-tight text-lg text-white">FinTrack</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {baseNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <motion.div key={item.href} variants={itemVariants} className="relative">
                  {active && (
                    <motion.span
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "rgba(34,197,94,0.15)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? "text-green-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}

            {/* Admin section */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-1 px-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">
                    Admin
                  </p>
                </div>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <motion.div key={item.href} variants={itemVariants} className="relative">
                      {active && (
                        <motion.span
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: "rgba(34,197,94,0.15)" }}
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                      )}
                      <Link
                        href={item.href}
                        className={`relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          active
                            ? "text-green-400"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </>
            )}
          </motion.div>
        </nav>

        {/* User area */}
        <div
          className="p-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-200 text-sm truncate">
                {auth.user?.name ?? "Loading…"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {auth.user?.role === "admin" ? (
                  <span className="bg-amber-100 text-amber-800 text-xs rounded-full px-2 py-0.5 font-medium">
                    admin
                  </span>
                ) : (
                  <span className="bg-slate-700 text-slate-300 text-xs rounded-full px-2 py-0.5 font-medium">
                    user
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center px-6 justify-between shrink-0">
          <div className="w-96">
            <div className="relative">
              <input
                type="text"
                placeholder="Command / Search (⌘K)"
                className="w-full h-9 bg-muted border-transparent rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-colors placeholder:text-muted-foreground font-mono"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-muted/20 p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
