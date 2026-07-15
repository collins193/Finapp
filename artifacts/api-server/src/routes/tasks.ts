import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tasksTable, membersTable, projectsTable } from "@workspace/db";
import {
  ListTasksParams,
  CreateTaskParams,
  CreateTaskBody,
  GetTaskParams,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
  ListTasksResponse,
  ListAllTasksResponse,
  GetTaskResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichTask(t: {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  ownerId: number | null;
  dueDate: string | null;
  createdAt: Date;
}) {
  let ownerName: string | null = null;
  let ownerInitials: string | null = null;
  if (t.ownerId) {
    const [member] = await db.select().from(membersTable).where(eq(membersTable.id, t.ownerId));
    if (member) {
      ownerName = member.name;
      ownerInitials = member.initials;
    }
  }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, t.projectId));
  return {
    id: t.id,
    projectId: t.projectId,
    projectName: project?.name ?? null,
    title: t.title,
    description: t.description ?? null,
    status: t.status,
    priority: t.priority,
    ownerId: t.ownerId ?? null,
    ownerName,
    ownerInitials,
    dueDate: t.dueDate ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/projects/:projectId/tasks", async (req, res): Promise<void> => {
  const params = ListTasksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.projectId, params.data.projectId))
    .orderBy(tasksTable.createdAt);
  const enriched = await Promise.all(tasks.map(enrichTask));
  res.json(ListTasksResponse.parse(enriched));
});

router.post("/projects/:projectId/tasks", async (req, res): Promise<void> => {
  const params = CreateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [t] = await db
    .insert(tasksTable)
    .values({
      projectId: params.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      ownerId: parsed.data.ownerId ?? null,
      dueDate: parsed.data.dueDate ?? null,
    })
    .returning();
  const enriched = await enrichTask(t);
  res.status(201).json(CreateTaskResponse.parse(enriched));
});

router.get("/tasks", async (req, res): Promise<void> => {
  const tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
  const enriched = await Promise.all(tasks.map(enrichTask));
  res.json(ListAllTasksResponse.parse(enriched));
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [t] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!t) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const enriched = await enrichTask(t);
  res.json(GetTaskResponse.parse(enriched));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if ("ownerId" in parsed.data) updateData.ownerId = parsed.data.ownerId ?? null;
  if ("dueDate" in parsed.data) updateData.dueDate = parsed.data.dueDate ?? null;

  const [t] = await db.update(tasksTable).set(updateData).where(eq(tasksTable.id, params.data.id)).returning();
  if (!t) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const enriched = await enrichTask(t);
  res.json(UpdateTaskResponse.parse(enriched));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [t] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!t) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
