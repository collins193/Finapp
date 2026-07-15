import { Link, useLocation } from "wouter"
import { Activity, Briefcase, LayoutDashboard, PieChart, Users } from "lucide-react"

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Portfolios", href: "/portfolios", icon: PieChart },
    { label: "Projects", href: "/projects", icon: Briefcase },
    { label: "Tasks", href: "/tasks", icon: Activity },
    { label: "Members", href: "/members", icon: Users },
  ]

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-sidebar-primary-foreground">
            <div className="h-8 w-8 rounded-sm bg-accent flex items-center justify-center">
              <span className="font-bold text-accent-foreground font-mono">FT</span>
            </div>
            <span className="font-semibold tracking-tight text-lg">FinTrack</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location === item.href || 
                            (item.href !== "/" && location.startsWith(item.href))
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold text-xs">
              AD
            </div>
            <div className="text-sm">
              <p className="font-medium text-sidebar-foreground">Admin User</p>
              <p className="text-xs text-sidebar-foreground/60">admin@fintrack.app</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar / Search area */}
        <header className="h-16 border-b bg-card flex items-center px-6 justify-between shrink-0">
          <div className="w-96">
            {/* Minimalist search placeholder */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Command / Search (⌘K)" 
                className="w-full h-9 bg-muted border-transparent rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-colors placeholder:text-muted-foreground font-mono"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/20 p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
