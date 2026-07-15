import { Shell } from "@/components/layout/Shell"
import { useGetDashboardSummary, useGetRecentActivity, useGetTaskBreakdown } from "@workspace/api-client-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { ActivityItem } from "@workspace/api-client-react/src/generated/api.schemas"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: ["dashboard-summary"] }
  })
  
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity({
    query: { queryKey: ["dashboard-activity"] }
  })

  const { data: tasks, isLoading: loadingTasks } = useGetTaskBreakdown({
    query: { queryKey: ["dashboard-tasks"] }
  })

  return (
    <Shell>
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
            <p className="text-muted-foreground mt-1">Your portfolio value and task overview.</p>
          </div>
        </div>

        {/* Top level stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Total Portfolio Value</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {loadingSummary ? <Skeleton className="h-8 w-32" /> : formatCurrency(summary?.totalPortfolioValue || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <div className={`text-sm font-medium flex items-center gap-1 ${(summary?.totalGainLoss || 0) >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {(summary?.totalGainLoss || 0) >= 0 ? '+' : ''}{formatCurrency(summary?.totalGainLoss || 0)} 
                  <span className="text-muted-foreground ml-1">
                    ({(summary?.totalGainLossPercent || 0) >= 0 ? '+' : ''}{formatPercent(summary?.totalGainLossPercent || 0)})
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Open Tasks</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {loadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.openTasks || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Across {summary?.projectCount || 0} active projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Overdue</CardDescription>
              <CardTitle className="text-3xl font-bold text-destructive">
                {loadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.overdueTasks || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Tasks require attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Portfolios</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {loadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.portfolioCount || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Managed accounts</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart / Tasks Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Task Breakdown</CardTitle>
              <CardDescription>Current open tasks by status</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">By Status</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {tasks?.byStatus.map((item) => (
                        <div key={item.label} className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg border border-border/50">
                          <span className="text-2xl font-bold text-foreground mb-1">{item.count}</span>
                          <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground">{item.label.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">By Priority</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {tasks?.byPriority.map((item) => (
                        <div key={item.label} className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg border border-border/50">
                          <span className="text-2xl font-bold text-foreground mb-1">{item.count}</span>
                          <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest portfolio & project actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {loadingActivity ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-2 w-2 rounded-full mt-2" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
                ) : activity?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                ) : (
                  activity?.map((item: ActivityItem) => (
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
    </Shell>
  )
}
