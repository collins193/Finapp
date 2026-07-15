import { Router, type IRouter } from "express";
import { eq, lt, count, sql } from "drizzle-orm";
import { db, portfoliosTable, holdingsTable, transactionsTable, projectsTable, tasksTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRecentActivityResponse,
  GetTaskBreakdownResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const portfolios = await db.select().from(portfoliosTable);
  const allHoldings = await db.select().from(holdingsTable);

  let totalPortfolioValue = 0;
  let totalCost = 0;
  for (const h of allHoldings) {
    const qty = parseFloat(h.quantity);
    const price = parseFloat(h.currentPrice);
    const cost = parseFloat(h.avgCostBasis);
    totalPortfolioValue += qty * price;
    totalCost += qty * cost;
  }
  const totalGainLoss = totalPortfolioValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const today = new Date().toISOString().split("T")[0];
  const allTasks = await db.select().from(tasksTable);
  const totalTasks = allTasks.length;
  const openTasks = allTasks.filter((t) => t.status !== "done").length;
  const overdueTasks = allTasks.filter(
    (t) => t.status !== "done" && t.dueDate !== null && t.dueDate < today,
  ).length;

  const projects = await db.select().from(projectsTable);

  res.json(
    GetDashboardSummaryResponse.parse({
      totalPortfolioValue,
      totalGainLoss,
      totalGainLossPercent,
      portfolioCount: portfolios.length,
      totalTasks,
      openTasks,
      overdueTasks,
      projectCount: projects.length,
    }),
  );
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const recentTxns = await db
    .select()
    .from(transactionsTable)
    .orderBy(sql`${transactionsTable.createdAt} desc`)
    .limit(5);

  const recentTasks = await db
    .select()
    .from(tasksTable)
    .orderBy(sql`${tasksTable.updatedAt} desc`)
    .limit(5);

  const activity: {
    id: string;
    type: "transaction" | "task_created" | "task_updated" | "task_completed" | "project_created";
    description: string;
    meta: string | null;
    timestamp: string;
  }[] = [];

  for (const t of recentTxns) {
    activity.push({
      id: `txn-${t.id}`,
      type: "transaction",
      description: `${t.type.charAt(0).toUpperCase() + t.type.slice(1)} ${parseFloat(t.quantity)} ${t.ticker} @ $${parseFloat(t.price).toFixed(2)}`,
      meta: `$${parseFloat(t.total).toFixed(2)}`,
      timestamp: t.createdAt.toISOString(),
    });
  }

  for (const t of recentTasks) {
    const type = t.status === "done" ? "task_completed" : "task_updated";
    activity.push({
      id: `task-${t.id}`,
      type,
      description: t.status === "done" ? `Completed: ${t.title}` : `Updated task: ${t.title}`,
      meta: t.priority,
      timestamp: (t as unknown as { updatedAt: Date }).updatedAt?.toISOString() ?? t.createdAt.toISOString(),
    });
  }

  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(GetRecentActivityResponse.parse(activity.slice(0, 10)));
});

router.get("/dashboard/task-breakdown", async (req, res): Promise<void> => {
  const tasks = await db.select().from(tasksTable);

  const statusCounts: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
  const priorityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };

  for (const t of tasks) {
    if (t.status in statusCounts) statusCounts[t.status]++;
    if (t.priority in priorityCounts) priorityCounts[t.priority]++;
  }

  const byStatus = Object.entries(statusCounts).map(([label, c]) => ({ label, count: c }));
  const byPriority = Object.entries(priorityCounts).map(([label, c]) => ({ label, count: c }));

  res.json(GetTaskBreakdownResponse.parse({ byStatus, byPriority }));
});

export default router;
