import { db, client } from "./index.js";
import { teams, competencyAreas, users, newsSources, radarBlips, radarBlipHistory } from "./schema.js";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create tables
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      title TEXT,
      team_id INTEGER REFERENCES teams(id),
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS responsibilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS competency_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS competency_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      competency_area_id INTEGER NOT NULL REFERENCES competency_areas(id) ON DELETE CASCADE,
      level INTEGER NOT NULL,
      notes TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      entity_name TEXT,
      details TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'rss',
      category TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_fetched_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER REFERENCES news_sources(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      link TEXT,
      description TEXT,
      content TEXT,
      author TEXT,
      category TEXT,
      published_at TEXT,
      guid TEXT,
      bookmarked INTEGER NOT NULL DEFAULT 0,
      read INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS radar_blips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quadrant TEXT NOT NULL,
      ring TEXT NOT NULL,
      description TEXT,
      rationale TEXT,
      competency_area_id INTEGER REFERENCES competency_areas(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS radar_blip_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blip_id INTEGER NOT NULL REFERENCES radar_blips(id) ON DELETE CASCADE,
      from_ring TEXT,
      to_ring TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed teams
  const existingTeams = await db.select().from(teams);
  if (existingTeams.length === 0) {
    await db.insert(teams).values([
      { name: "Team System", description: "Systemdrift og -utvikling" },
      { name: "Team Teknologi", description: "Nettverks- og infrastrukturteknologi" },
    ]);
    console.log("  ✅ Teams seeded");
  }

  // Seed competency areas
  const existingAreas = await db.select().from(competencyAreas);
  if (existingAreas.length === 0) {
    await db.insert(competencyAreas).values([
      { name: "Fiberoptikk / GPON / XGS-PON", category: "Nettverksteknologi", description: "Passive optiske nettverk og fiberinfrastruktur" },
      { name: "IP-nett / routing / switching", category: "Nettverksteknologi", description: "IP-basert nettverksinfrastruktur" },
      { name: "DWDM / transport", category: "Nettverksteknologi", description: "Bølgelengdemultipleksing og transportnett" },
      { name: "Provisjonering og OSS/BSS", category: "Plattformer/systemer", description: "Operations/Business Support Systems" },
      { name: "Overvåking (NMS/EMS)", category: "Plattformer/systemer", description: "Nettverksovervåking og element management" },
      { name: "Prosjektledelse", category: "Metoder/prosesser", description: "Prosjektplanlegging, oppfølging og gjennomføring" },
      { name: "Regulatorisk (NKOM, tilgangsforpliktelser)", category: "Regulatorisk", description: "Regulatoriske krav og tilgangsforpliktelser" },
      { name: "HMS / kvalitet", category: "Metoder/prosesser", description: "Helse, miljø og sikkerhet, kvalitetsstyring" },
      { name: "Kundeinstallasjon", category: "Nettverksteknologi", description: "Installasjon og oppkobling hos sluttkunde" },
    ]);
    console.log("  ✅ Competency areas seeded");
  }

  // Seed default admin user
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    const passwordHash = await bcrypt.hash("admin", 12);
    await db.insert(users).values({
      username: "admin",
      passwordHash,
      displayName: "Fagansvarlig Teknologi",
    });
    console.log("  ✅ Default admin user created (username: admin, password: admin)");
  }

  // Seed default news sources
  const existingSources = await db.select().from(newsSources);
  if (existingSources.length === 0) {
    await db.insert(newsSources).values([
      { name: "NKOM", url: "https://www.nkom.no/rss", sourceType: "rss", category: "Regulatorisk" },
      { name: "Light Reading", url: "https://www.lightreading.com/rss.xml", sourceType: "rss", category: "Teknisk" },
      { name: "Fierce Telecom", url: "https://www.fiercetelecom.com/rss/xml", sourceType: "rss", category: "Teknisk" },
      { name: "Regjeringen - Digitalisering", url: "https://www.regjeringen.no/no/tema/transport-og-kommunikasjon/elektronisk-kommunikasjon/id560/rss/", sourceType: "rss", category: "Regulatorisk" },
      { name: "Telenor Pressemeldinger", url: "https://www.telenor.com/media/press-releases/feed/", sourceType: "rss", category: "Marked" },
      { name: "Telecom Revy", url: "https://www.telecomrevy.no/sitemap.xml", sourceType: "sitemap", category: "Teknisk" },
    ]);
    console.log("  ✅ Default news sources seeded");
  }

  // Seed example radar blips
  const existingBlips = await db.select().from(radarBlips);
  if (existingBlips.length === 0) {
    const blipData = [
      { name: "XGS-PON", quadrant: "Nettverksteknologi", ring: "adopt", description: "10G symmetrisk PON – neste generasjon FTTH", rationale: "Standardisert, tilgjengelig fra flere leverandører" },
      { name: "GPON", quadrant: "Nettverksteknologi", ring: "adopt", description: "Gigabit Passive Optical Network", rationale: "Veletablert, grunnstammen i fibernettet" },
      { name: "25GS-PON", quadrant: "Nettverksteknologi", ring: "assess", description: "25G symmetrisk PON – fremtidig oppgradering", rationale: "Under standardisering, følg med" },
      { name: "WiFi 7", quadrant: "Nettverksteknologi", ring: "trial", description: "IEEE 802.11be – neste generasjon WiFi", rationale: "Relevante bruksområder for bedriftskunder" },
      { name: "DWDM", quadrant: "Nettverksteknologi", ring: "adopt", description: "Dense Wavelength Division Multiplexing", rationale: "Kritisk for transportnett" },
      { name: "Netbox", quadrant: "Plattformer/systemer", ring: "trial", description: "DCIM og IPAM – nettverksdokumentasjon", rationale: "Erstatter manuelle oversikter" },
      { name: "Zabbix", quadrant: "Plattformer/systemer", ring: "adopt", description: "Nettverksovervåking", rationale: "Veletablert, god støtte for SNMP" },
      { name: "Docker", quadrant: "Verktøy", ring: "adopt", description: "Containerisering av applikasjoner", rationale: "Standard for deployment" },
      { name: "Ansible", quadrant: "Verktøy", ring: "trial", description: "Automatisering av nettverkskonfigurasjon", rationale: "Testes for konfigurasjonsstyring av nettverksutstyr" },
      { name: "Jira", quadrant: "Verktøy", ring: "adopt", description: "Prosjekt- og oppgavestyring", rationale: "Brukes i hele organisasjonen" },
      { name: "Confluence", quadrant: "Verktøy", ring: "adopt", description: "Dokumentasjon og kunnskapsdeling", rationale: "Standard dokumentasjonsverktøy" },
      { name: "ITIL", quadrant: "Metoder/prosesser", ring: "assess", description: "IT Service Management rammeverk", rationale: "Vurderer relevans for våre prosesser" },
      { name: "DevOps", quadrant: "Metoder/prosesser", ring: "trial", description: "Kultur og praksis for kontinuerlig leveranse", rationale: "Implementeres gradvis i driften" },
      { name: "Agile", quadrant: "Metoder/prosesser", ring: "adopt", description: "Smidig prosjektmetodikk", rationale: "Brukes i prosjektarbeid" },
    ];

    for (const blip of blipData) {
      const [inserted] = await db.insert(radarBlips).values(blip).returning();
      await db.insert(radarBlipHistory).values({
        blipId: inserted.id,
        fromRing: null,
        toRing: blip.ring,
        note: "Initiell plassering",
      });
    }
    console.log("  ✅ Radar blips seeded");
  }

  console.log("🌱 Seeding complete!");
}

seed().catch(console.error);
