import { Router } from "express";
import { db } from "../db/index.js";
import { teams, activityLog } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

router.get("/", async (_req, res) => {
  const result = await db.query.teams.findMany({ with: { employees: true } });
  res.json(result);
});

router.get("/:id", async (req, res) => {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, parseInt(req.params.id)),
    with: { employees: true },
  });
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  res.json(team);
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await db.insert(teams).values({ name, description }).returning();

    await db.insert(activityLog).values({
      action: "created", entityType: "team", entityId: result.id,
      entityName: name, userId: req.userId,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create team" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    const [result] = await db.update(teams)
      .set({ name, description, updatedAt: new Date().toISOString() })
      .where(eq(teams.id, id))
      .returning();

    if (!result) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    await db.insert(activityLog).values({
      action: "updated", entityType: "team", entityId: id,
      entityName: name, userId: req.userId,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update team" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    await db.delete(teams).where(eq(teams.id, id));

    await db.insert(activityLog).values({
      action: "deleted", entityType: "team", entityId: id,
      entityName: team.name, userId: req.userId,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete team" });
  }
});

export default router;
