import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.resolve(__dirname, "../../../../data/fa-controller.db");
const dbPath = process.env.DATABASE_URL || `file:${defaultDbPath}`;

const client = createClient({ url: dbPath });
export const db = drizzle(client, { schema });
export { client };
