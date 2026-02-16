import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Employee, Team, CompetencyArea } from "../types";
import {
  Users,
  Network,
  GraduationCap,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardStats {
  totalEmployees: number;
  teams: Team[];
  competencyAreas: CompetencyArea[];
  employees: Employee[];
}

function StatCard({ icon: Icon, label, value, accent, delay, to }: {
  icon: typeof Users;
  label: string;
  value: string | number;
  accent: string;
  delay: number;
  to: string;
}) {
  return (
    <Link to={to}
      className={`card-panel p-5 group cursor-pointer animate-slide-in-up`}
      style={{ animationDelay: `${delay * 0.07}s` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}
             style={{ background: `${accent}15` }}>
          <Icon size={20} style={{ color: accent }} />
        </div>
        <ArrowUpRight size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="font-mono text-3xl font-semibold text-heading tracking-tight">{value}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
    </Link>
  );
}

function CompetencyBar({ name, count, max }: { name: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-t-default truncate mr-2">{name}</span>
        <span className="font-mono text-xs text-muted">{count}</span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--color-fiber-dim), var(--color-fiber))`,
          }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getEmployees(), api.getTeams(), api.getCompetencyAreas()])
      .then(([employees, teams, competencyAreas]) => {
        setStats({ totalEmployees: employees.length, teams, competencyAreas, employees });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-fiber/30 border-t-fiber rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const teamSystem = stats.teams.find(t => t.name.includes("System"));
  const teamTech = stats.teams.find(t => t.name.includes("Teknologi"));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-in-up">
        <h1 className="font-display text-3xl text-heading tracking-tight">Dashboard</h1>
        <p className="text-muted mt-1">
          Avdeling Teknologi · <span className="font-mono text-xs">{new Date().toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </p>
        <div className="fiber-line mt-3 w-48" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Ansatte totalt" value={stats.totalEmployees} accent="var(--color-fiber)" delay={1} to="/employees" />
        <StatCard icon={Network} label="Team" value={stats.teams.length} accent="var(--color-signal)" delay={2} to="/teams" />
        <StatCard icon={GraduationCap} label="Kompetanseområder" value={stats.competencyAreas.length} accent="var(--color-info)" delay={3} to="/competencies" />
        <StatCard icon={TrendingUp} label="Kompetansevurderinger" value={stats.employees.reduce((acc, e) => acc + (e.competencyRatings?.length || 0), 0)} accent="var(--color-warn)" delay={4} to="/competencies" />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Team overview */}
        <div className="card-panel p-5 animate-slide-in-up stagger-4">
          <div className="flex items-center gap-2 mb-4">
            <Network size={16} className="text-signal" />
            <h2 className="font-display text-lg text-heading">Teamfordeling</h2>
          </div>

          <div className="space-y-4">
            {[teamSystem, teamTech].filter(Boolean).map((team) => {
              const memberCount = team!.employees?.length || 0;
              return (
                <Link key={team!.id} to="/teams" className="block group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-t-bright font-medium group-hover:text-fiber transition-colors">
                      {team!.name}
                    </span>
                    <span className="font-mono text-xs text-muted">{memberCount} ansatte</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${stats.totalEmployees > 0 ? (memberCount / 15) * 100 : 0}%`,
                        background: team!.name.includes("System")
                          ? "linear-gradient(90deg, var(--color-fiber-dim), var(--color-fiber))"
                          : "linear-gradient(90deg, var(--color-signal-dim), var(--color-signal))",
                      }}
                    />
                  </div>
                </Link>
              );
            })}

            {stats.totalEmployees === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted">Ingen ansatte registrert ennå</p>
                <Link to="/employees" className="inline-flex items-center gap-1 mt-2 text-sm text-fiber hover:text-fiber-dim transition-colors">
                  Legg til ansatte <ArrowUpRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Competency overview */}
        <div className="card-panel p-5 lg:col-span-2 animate-slide-in-up stagger-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={16} className="text-info" />
            <h2 className="font-display text-lg text-heading">Kompetanseområder</h2>
          </div>

          {stats.competencyAreas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {stats.competencyAreas.map((area) => (
                <CompetencyBar
                  key={area.id}
                  name={area.name}
                  count={area.ratings?.length || 0}
                  max={stats.totalEmployees || 1}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-6">Ingen kompetanseområder registrert</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card-panel p-5 animate-slide-in-up stagger-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-warn" />
          <h2 className="font-display text-lg text-heading">Hurtighandlinger</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/employees" className="btn-fiber px-4 py-2 text-sm">
            + Ny ansatt
          </Link>
          <Link to="/competencies" className="px-4 py-2 text-sm rounded-md border border-b-subtle text-t-default hover:border-fiber/30 hover:text-fiber transition-all">
            Kompetansematrise
          </Link>
          <Link to="/teams" className="px-4 py-2 text-sm rounded-md border border-b-subtle text-t-default hover:border-signal/30 hover:text-signal transition-all">
            Teamoversikt
          </Link>
        </div>
      </div>
    </div>
  );
}
