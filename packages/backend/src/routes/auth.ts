import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateToken, authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id, user.username);
    res.json({ token, user: { id: user.id, username: user.username, displayName: user.displayName } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authenticateToken, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, username: user.username, displayName: user.displayName });
});

export default router;
