import { Router } from "express";
import { db } from "../db/index.js";
import { employees, responsibilities, competencyRatings, competencyAreas, activityLog } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(authenticateToken);

// List all employees with team info
router.get("/", async (_req, res) => {
  const result = await db.query.employees.findMany({
    with: { team: true, responsibilities: true, competencyRatings: { with: { competencyArea: true } } },
  });
  res.json(result);
});

// Get single employee
router.get("/:id", async (req, res) => {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, parseInt(req.params.id)),
    with: { team: true, responsibilities: true, competencyRatings: { with: { competencyArea: true } } },
  });
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(employee);
});

// Create employee
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, email, phone, title, teamId, imageUrl } = req.body;
    const [result] = await db.insert(employees).values({
      firstName, lastName, email, phone, title, teamId, imageUrl,
    }).returning();

    await db.insert(activityLog).values({
      action: "created", entityType: "employee", entityId: result.id,
      entityName: `${firstName} ${lastName}`, userId: req.userId,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// Update employee
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { firstName, lastName, email, phone, title, teamId, imageUrl } = req.body;
    const [result] = await db.update(employees)
      .set({ firstName, lastName, email, phone, title, teamId, imageUrl, updatedAt: new Date().toISOString() })
      .where(eq(employees.id, id))
      .returning();

    if (!result) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    await db.insert(activityLog).values({
      action: "updated", entityType: "employee", entityId: id,
      entityName: `${firstName} ${lastName}`, userId: req.userId,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// Delete employee
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    await db.delete(employees).where(eq(employees.id, id));

    await db.insert(activityLog).values({
      action: "deleted", entityType: "employee", entityId: id,
      entityName: `${employee.firstName} ${employee.lastName}`, userId: req.userId,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

// Manage responsibilities for an employee
router.post("/:id/responsibilities", async (req: AuthRequest, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const { title, description } = req.body;
    const [result] = await db.insert(responsibilities).values({ employeeId, title, description }).returning();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to add responsibility" });
  }
});

router.delete("/:id/responsibilities/:respId", async (_req, res) => {
  try {
    await db.delete(responsibilities).where(eq(responsibilities.id, parseInt(_req.params.respId)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete responsibility" });
  }
});

// Set competency rating for an employee
router.put("/:id/competencies/:areaId", async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const competencyAreaId = parseInt(req.params.areaId);
    const { level, notes } = req.body;

    // Upsert: check if rating exists
    const ratings = await db.select().from(competencyRatings)
      .where(eq(competencyRatings.employeeId, employeeId));
    const existing = ratings.find(r => r.competencyAreaId === competencyAreaId);

    if (existing) {
      const [result] = await db.update(competencyRatings)
        .set({ level, notes, updatedAt: new Date().toISOString() })
        .where(eq(competencyRatings.id, existing.id))
        .returning();
      res.json(result);
    } else {
      const [result] = await db.insert(competencyRatings)
        .values({ employeeId, competencyAreaId, level, notes })
        .returning();
      res.status(201).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update competency rating" });
  }
});

export default router;
