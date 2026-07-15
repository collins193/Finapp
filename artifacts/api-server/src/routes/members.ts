import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, membersTable } from "@workspace/db";
import {
  CreateMemberBody,
  UpdateMemberParams,
  UpdateMemberBody,
  DeleteMemberParams,
  ListMembersResponse,
  CreateMemberResponse,
  UpdateMemberResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function deriveInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function buildMember(m: {
  id: number;
  name: string;
  initials: string;
  role: string;
  email: string | null;
  avatarColor: string | null;
  createdAt: Date;
}) {
  return {
    id: m.id,
    name: m.name,
    initials: m.initials,
    role: m.role,
    email: m.email ?? null,
    avatarColor: m.avatarColor ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/members", async (req, res): Promise<void> => {
  const members = await db.select().from(membersTable).orderBy(membersTable.createdAt);
  res.json(ListMembersResponse.parse(members.map(buildMember)));
});

router.post("/members", async (req, res): Promise<void> => {
  const parsed = CreateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const initials = deriveInitials(parsed.data.name);
  const [m] = await db
    .insert(membersTable)
    .values({
      name: parsed.data.name,
      initials,
      role: parsed.data.role,
      email: parsed.data.email ?? null,
      avatarColor: parsed.data.avatarColor ?? null,
    })
    .returning();
  res.status(201).json(CreateMemberResponse.parse(buildMember(m)));
});

router.patch("/members/:id", async (req, res): Promise<void> => {
  const params = UpdateMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) {
    updateData.name = parsed.data.name;
    updateData.initials = deriveInitials(parsed.data.name);
  }
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.avatarColor !== undefined) updateData.avatarColor = parsed.data.avatarColor;

  const [m] = await db.update(membersTable).set(updateData).where(eq(membersTable.id, params.data.id)).returning();
  if (!m) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json(UpdateMemberResponse.parse(buildMember(m)));
});

router.delete("/members/:id", async (req, res): Promise<void> => {
  const params = DeleteMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [m] = await db.delete(membersTable).where(eq(membersTable.id, params.data.id)).returning();
  if (!m) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
