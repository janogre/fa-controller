import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import teamRoutes from "./routes/teams.js";
import competencyRoutes from "./routes/competencies.js";
import newsRoutes from "./routes/news.js";
import radarRoutes from "./routes/radar.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/competencies", competencyRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/radar", radarRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 FA-Controller backend running on http://localhost:${PORT}`);
});
