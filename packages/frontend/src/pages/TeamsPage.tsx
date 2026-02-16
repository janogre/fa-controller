import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Team } from "../types";
import { Network, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTeams().then(setTeams).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-fiber/30 border-t-fiber rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="animate-slide-in-up">
        <h1 className="font-display text-3xl text-heading tracking-tight">Team</h1>
        <p className="text-muted mt-1">Organisering av avdeling Teknologi</p>
        <div className="fiber-line mt-3 w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teams.map((team, i) => {
          const accentColor = team.name.includes("System") ? "fiber" : "signal";
          return (
            <div key={team.id} className="card-panel p-6 animate-slide-in-up" style={{ animationDelay: `${(i + 1) * 0.08}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                       style={{ background: `var(--color-${accentColor})15` }}>
                    <Network size={20} style={{ color: `var(--color-${accentColor})` }} />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-heading">{team.name}</h2>
                    {team.description && <p className="text-sm text-muted">{team.description}</p>}
                  </div>
                </div>
                <span className="font-mono text-2xl font-semibold text-heading">{team.employees?.length || 0}</span>
              </div>

              {team.employees && team.employees.length > 0 ? (
                <div className="space-y-2">
                  {team.employees.map((emp: any) => (
                    <div key={emp.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface/30 hover:bg-surface/60 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-surface border border-b-subtle flex items-center justify-center">
                        <span className="font-mono text-[0.55rem]" style={{ color: `var(--color-${accentColor})` }}>
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-t-bright">{emp.firstName} {emp.lastName}</span>
                        {emp.title && <span className="text-xs text-muted ml-2">· {emp.title}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-surface/20 rounded-lg">
                  <Users size={24} className="mx-auto text-muted/30 mb-2" />
                  <p className="text-sm text-muted">Ingen ansatte i dette teamet</p>
                  <Link to="/employees" className="text-sm text-fiber hover:text-fiber-dim transition-colors mt-1 inline-block">
                    Legg til ansatte →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
