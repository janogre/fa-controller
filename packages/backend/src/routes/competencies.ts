import { Router } from "express";
import { db } from "../db/index.js";
import { competencyAreas, activityLog } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

router.get("/", async (_req, res) => {
  const result = await db.query.competencyAreas.findMany({ with: { ratings: true } });
  res.json(result);
});

router.get("/:id", async (req, res) => {
  const area = await db.query.competencyAreas.findFirst({
    where: eq(competencyAreas.id, parseInt(req.params.id)),
    with: { ratings: { with: { employee: true } } },
  });
  if (!area) {
    res.status(404).json({ error: "Competency area not found" });
    return;
  }
  res.json(area);
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, category, description } = req.body;
    const [result] = await db.insert(competencyAreas).values({ name, category, description }).returning();

    await db.insert(activityLog).values({
      action: "created", entityType: "competency_area", entityId: result.id,
      entityName: name, userId: req.userId,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create competency area" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, category, description } = req.body;
    const [result] = await db.update(competencyAreas)
      .set({ name, category, description, updatedAt: new Date().toISOString() })
      .where(eq(competencyAreas.id, id))
      .returning();

    if (!result) {
      res.status(404).json({ error: "Competency area not found" });
      return;
    }

    await db.insert(activityLog).values({
      action: "updated", entityType: "competency_area", entityId: id,
      entityName: name, userId: req.userId,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update competency area" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [area] = await db.select().from(competencyAreas).where(eq(competencyAreas.id, id));
    if (!area) {
      res.status(404).json({ error: "Competency area not found" });
      return;
    }
    await db.delete(competencyAreas).where(eq(competencyAreas.id, id));

    await db.insert(activityLog).values({
      action: "deleted", entityType: "competency_area", entityId: id,
      entityName: area.name, userId: req.userId,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete competency area" });
  }
});

export default router;
