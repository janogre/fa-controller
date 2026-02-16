import { Router } from "express";
import { db } from "../db/index.js";
import { radarBlips, radarBlipHistory, activityLog } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

// List all blips with history and competency area
router.get("/", async (_req, res) => {
  const result = await db.query.radarBlips.findMany({
    with: { history: true, competencyArea: true },
    orderBy: [desc(radarBlips.updatedAt)],
  });
  res.json(result);
});

// Get single blip
router.get("/:id", async (req, res) => {
  const blip = await db.query.radarBlips.findFirst({
    where: eq(radarBlips.id, parseInt(req.params.id as string)),
    with: { history: true, competencyArea: { with: { ratings: { with: { employee: true } } } } },
  });
  if (!blip) {
    res.status(404).json({ error: "Blip not found" });
    return;
  }
  res.json(blip);
});

// Create blip
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, quadrant, ring, description, rationale, competencyAreaId } = req.body;
    const [result] = await db.insert(radarBlips).values({
      name, quadrant, ring, description, rationale, competencyAreaId,
    }).returning();

    // Record initial history
    await db.insert(radarBlipHistory).values({
      blipId: result.id, fromRing: null, toRing: ring, note: "Opprettet",
    });

    await db.insert(activityLog).values({
      action: "created", entityType: "radar_blip", entityId: result.id,
      entityName: name, userId: req.userId,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create blip" });
  }
});

// Update blip
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, quadrant, ring, description, rationale, competencyAreaId } = req.body;

    // Get current blip to check for ring change
    const [current] = await db.select().from(radarBlips).where(eq(radarBlips.id, id));
    if (!current) {
      res.status(404).json({ error: "Blip not found" });
      return;
    }

    const [result] = await db.update(radarBlips)
      .set({ name, quadrant, ring, description, rationale, competencyAreaId, updatedAt: new Date().toISOString() })
      .where(eq(radarBlips.id, id))
      .returning();

    // Record ring change in history
    if (current.ring !== ring) {
      await db.insert(radarBlipHistory).values({
        blipId: id, fromRing: current.ring, toRing: ring,
        note: req.body.historyNote || null,
      });
    }

    await db.insert(activityLog).values({
      action: "updated", entityType: "radar_blip", entityId: id,
      entityName: name, userId: req.userId,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update blip" });
  }
});

// Delete blip
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [blip] = await db.select().from(radarBlips).where(eq(radarBlips.id, id));
    if (!blip) {
      res.status(404).json({ error: "Blip not found" });
      return;
    }

    await db.delete(radarBlips).where(eq(radarBlips.id, id));

    await db.insert(activityLog).values({
      action: "deleted", entityType: "radar_blip", entityId: id,
      entityName: blip.name, userId: req.userId,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete blip" });
  }
});

// Get history for a blip
router.get("/:id/history", async (req, res) => {
  const blipId = parseInt(req.params.id as string);
  const history = await db.select().from(radarBlipHistory)
    .where(eq(radarBlipHistory.blipId, blipId))
    .orderBy(desc(radarBlipHistory.createdAt));
  res.json(history);
});

export default router;
