import { Router, type IRouter } from "express";
import { eq, count, and } from "drizzle-orm";
import { db, projectsTable, tasksTable } from "@workspace/db";
import {
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
  ListProjectsResponse,
  GetProjectResponse,
  CreateProjectResponse,
  UpdateProjectResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildProject(p: {
  id: number;
  name: string;
  description: string | null;
  status: string;
  color: string | null;
  dueDate: string | null;
  createdAt: Date;
}) {
  const [totalResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(eq(tasksTable.projectId, p.id));
  const [doneResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(and(eq(tasksTable.projectId, p.id), eq(tasksTable.status, "done")));
  const taskCount = totalResult?.count ?? 0;
  const completedCount = doneResult?.count ?? 0;
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    status: p.status,
    color: p.color ?? null,
    dueDate: p.dueDate ?? null,
    progress,
    taskCount,
    completedCount,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/projects", async (req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
  const result = await Promise.all(projects.map(buildProject));
  res.json(ListProjectsResponse.parse(result));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [p] = await db.insert(projectsTable).values(parsed.data).returning();
  const project = await buildProject(p);
  res.status(201).json(CreateProjectResponse.parse(project));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!p) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const project = await buildProject(p);
  res.json(GetProjectResponse.parse(project));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [p] = await db
    .update(projectsTable)
    .set(parsed.data)
    .where(eq(projectsTable.id, params.data.id))
    .returning();
  if (!p) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const project = await buildProject(p);
  res.json(UpdateProjectResponse.parse(project));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [p] = await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id)).returning();
  if (!p) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
