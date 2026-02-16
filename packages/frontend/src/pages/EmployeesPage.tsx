import { useEffect, useState, FormEvent } from "react";
import { api } from "../services/api";
import { Employee, Team } from "../types";
import {
  Plus,
  Search,
  User,
  Mail,
  Phone,
  Briefcase,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

function EmployeeCard({ employee, onEdit, onDelete }: {
  employee: Employee;
  onEdit: (e: Employee) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="card-panel p-4 group">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-surface border border-b-subtle flex items-center justify-center shrink-0">
          <span className="font-mono text-sm text-fiber font-medium">
            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-t-bright font-medium truncate">
              {employee.firstName} {employee.lastName}
            </h3>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(employee)} className="p-1 rounded text-muted hover:text-fiber hover:bg-fiber-glow transition-colors">
                <Pencil size={13} />
              </button>
              <button onClick={() => onDelete(employee.id)} className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          {employee.title && (
            <p className="text-sm text-muted flex items-center gap-1.5 mt-0.5">
              <Briefcase size={12} /> {employee.title}
            </p>
          )}
          {employee.team && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[0.65rem] font-mono tracking-wider uppercase border"
              style={{
                color: employee.team.name.includes("System") ? "var(--color-fiber)" : "var(--color-signal)",
                borderColor: employee.team.name.includes("System") ? "var(--color-fiber)" : "var(--color-signal)",
                opacity: 0.7,
              }}>
              {employee.team.name}
            </span>
          )}
        </div>
        <div className="text-right shrink-0 space-y-1">
          {employee.email && (
            <p className="font-mono text-[0.65rem] text-muted flex items-center gap-1 justify-end">
              <Mail size={11} /> {employee.email}
            </p>
          )}
          {employee.phone && (
            <p className="font-mono text-[0.65rem] text-muted flex items-center gap-1 justify-end">
              <Phone size={11} /> {employee.phone}
            </p>
          )}
          {employee.competencyRatings && employee.competencyRatings.length > 0 && (
            <p className="font-mono text-[0.6rem] text-info/70 mt-1">
              {employee.competencyRatings.length} kompetanser
            </p>
          )}
        </div>
      </div>

      {/* Responsibilities */}
      {employee.responsibilities && employee.responsibilities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-b-subtle/50">
          <div className="flex flex-wrap gap-1.5">
            {employee.responsibilities.map((r: { id: number; title: string }) => (
              <span key={r.id} className="px-2 py-0.5 rounded-md bg-surface text-[0.7rem] text-t-default">
                {r.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeModal({ employee, teams, onSave, onClose }: {
  employee: Employee | null;
  teams: Team[];
  onSave: (data: Partial<Employee>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    title: employee?.title || "",
    teamId: employee?.teamId || "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      teamId: form.teamId ? Number(form.teamId) : null,
    } as Partial<Employee>);
  };

  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" onClick={onClose}>
      <div className="card-panel w-full max-w-lg mx-4 p-6 animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-heading">
            {employee ? "Rediger ansatt" : "Ny ansatt"}
          </h2>
          <button onClick={onClose} className="p-1 rounded text-muted hover:text-t-bright transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Fornavn *</label>
              <input required value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))}
                className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm
                           focus:outline-none focus:border-fiber/40 transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Etternavn *</label>
              <input required value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))}
                className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm
                           focus:outline-none focus:border-fiber/40 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Stilling</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm
                         focus:outline-none focus:border-fiber/40 transition-colors" />
          </div>

          <div>
            <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Team</label>
            <select value={form.teamId} onChange={e => setForm(f => ({...f, teamId: e.target.value}))}
              className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm
                         focus:outline-none focus:border-fiber/40 transition-colors">
              <option value="">Ikke valgt</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">E-post</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm
                           focus:outline-none focus:border-fiber/40 transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Telefon</label>
              <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm
                           focus:outline-none focus:border-fiber/40 transition-colors" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-b-subtle text-muted hover:text-t-bright transition-colors">
              Avbryt
            </button>
            <button type="submit" className="btn-fiber px-5 py-2 text-sm">
              {employee ? "Lagre endringer" : "Opprett ansatt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null });

  const loadData = () => {
    Promise.all([api.getEmployees(), api.getTeams()])
      .then(([emp, t]) => { setEmployees(emp); setTeams(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filtered = employees.filter(e => {
    const matchSearch = !search ||
      `${e.firstName} ${e.lastName} ${e.title || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchTeam = !teamFilter || String(e.teamId) === teamFilter;
    return matchSearch && matchTeam;
  });

  const handleSave = async (data: Partial<Employee>) => {
    try {
      if (modal.employee) {
        await api.updateEmployee(modal.employee.id, data);
      } else {
        await api.createEmployee(data);
      }
      setModal({ open: false, employee: null });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Er du sikker på at du vil slette denne ansatte?")) return;
    try {
      await api.deleteEmployee(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-fiber/30 border-t-fiber rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between animate-slide-in-up">
        <div>
          <h1 className="font-display text-3xl text-heading tracking-tight">Ansatte</h1>
          <p className="text-muted mt-1">
            <span className="font-mono text-sm">{employees.length}</span> ansatte i avdeling Teknologi
          </p>
          <div className="fiber-line mt-3 w-32" />
        </div>
        <button onClick={() => setModal({ open: true, employee: null })} className="btn-fiber px-4 py-2.5 text-sm flex items-center gap-2">
          <Plus size={16} /> Ny ansatt
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 animate-slide-in-up stagger-1">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søk etter ansatt..."
            className="w-full pl-9 pr-3 py-2 bg-panel border border-b-subtle rounded-lg text-t-bright text-sm
                       focus:outline-none focus:border-fiber/40 transition-colors placeholder:text-muted/50"
          />
        </div>
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
          className="px-3 py-2 bg-panel border border-b-subtle rounded-lg text-t-default text-sm
                     focus:outline-none focus:border-fiber/40 transition-colors">
          <option value="">Alle team</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Employee list */}
      <div className="space-y-2">
        {filtered.map((emp, i) => (
          <div key={emp.id} className={`animate-slide-in-up`} style={{ animationDelay: `${(i + 2) * 0.04}s` }}>
            <EmployeeCard employee={emp} onEdit={(e) => setModal({ open: true, employee: e })} onDelete={handleDelete} />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 card-panel">
            <User size={32} className="mx-auto text-muted/40 mb-3" />
            <p className="text-muted">
              {search || teamFilter ? "Ingen ansatte matcher søket" : "Ingen ansatte registrert ennå"}
            </p>
            {!search && !teamFilter && (
              <button onClick={() => setModal({ open: true, employee: null })} className="mt-3 text-sm text-fiber hover:text-fiber-dim transition-colors">
                Legg til første ansatt →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <EmployeeModal
          employee={modal.employee}
          teams={teams}
          onSave={handleSave}
          onClose={() => setModal({ open: false, employee: null })}
        />
      )}
    </div>
  );
}
