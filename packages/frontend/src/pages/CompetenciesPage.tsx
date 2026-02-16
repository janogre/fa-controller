import { useEffect, useState, FormEvent } from "react";
import { api } from "../services/api";
import { Employee, CompetencyArea } from "../types";
import { GraduationCap, Plus, X, Pencil, Trash2, Search } from "lucide-react";

const levelColors: Record<number, string> = {
  1: "bg-red-900/40 text-red-300 border-red-800/50",
  2: "bg-orange-900/40 text-orange-300 border-orange-800/50",
  3: "bg-yellow-900/40 text-yellow-300 border-yellow-800/50",
  4: "bg-emerald-900/40 text-emerald-300 border-emerald-800/50",
  5: "bg-cyan-900/40 text-cyan-300 border-cyan-800/50",
};

const levelLabels: Record<number, string> = {
  1: "Grunnleggende",
  2: "Noe erfaring",
  3: "Kompetent",
  4: "Avansert",
  5: "Ekspert",
};

function LevelBadge({ level, onClick }: { level: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-md border text-xs font-mono font-semibold flex items-center justify-center mx-auto
                  transition-all hover:scale-110 ${levelColors[level] || "bg-surface text-muted border-b-subtle"}`}
      title={levelLabels[level]}
    >
      {level}
    </button>
  );
}

function EmptyCell({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-md border border-dashed border-b-subtle text-muted/30 text-xs flex items-center justify-center mx-auto
                 hover:border-fiber/30 hover:text-fiber/50 transition-all"
    >
      ·
    </button>
  );
}

function RatingModal({ employee, area, currentLevel, onSave, onClose }: {
  employee: Employee;
  area: CompetencyArea;
  currentLevel: number | null;
  onSave: (level: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" onClick={onClose}>
      <div className="card-panel w-full max-w-sm mx-4 p-6 animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-heading">Vurdering</h3>
          <button onClick={onClose} className="p-1 rounded text-muted hover:text-t-bright transition-colors"><X size={18} /></button>
        </div>
        <p className="text-sm text-t-default mb-1">{employee.firstName} {employee.lastName}</p>
        <p className="text-sm text-muted mb-5">{area.name}</p>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map(level => (
            <button key={level} onClick={() => onSave(level)}
              className={`w-14 h-14 rounded-lg border text-lg font-mono font-semibold flex flex-col items-center justify-center gap-0.5
                         transition-all hover:scale-105 ${level === currentLevel ? "ring-2 ring-fiber" : ""} ${levelColors[level]}`}>
              {level}
              <span className="text-[0.5rem] opacity-70">{levelLabels[level].slice(0, 5)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AreaModal({ area, onSave, onClose }: {
  area: CompetencyArea | null;
  onSave: (data: Partial<CompetencyArea>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: area?.name || "", category: area?.category || "", description: area?.description || "" });
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); onSave(form as Partial<CompetencyArea>); };

  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" onClick={onClose}>
      <div className="card-panel w-full max-w-md mx-4 p-6 animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-heading">{area ? "Rediger kompetanseområde" : "Nytt kompetanseområde"}</h2>
          <button onClick={onClose} className="p-1 rounded text-muted hover:text-t-bright transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Navn *</label>
            <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm focus:outline-none focus:border-fiber/40 transition-colors" />
          </div>
          <div>
            <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Kategori</label>
            <input value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
              placeholder="F.eks. Nettverksteknologi"
              className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm focus:outline-none focus:border-fiber/40 transition-colors placeholder:text-muted/40" />
          </div>
          <div>
            <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Beskrivelse</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2}
              className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm focus:outline-none focus:border-fiber/40 transition-colors resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-b-subtle text-muted hover:text-t-bright transition-colors">Avbryt</button>
            <button type="submit" className="btn-fiber px-5 py-2 text-sm">{area ? "Lagre" : "Opprett"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeProfileModal({ employee, areas, getRating, onSetRating, onClose }: {
  employee: Employee;
  areas: CompetencyArea[];
  getRating: (employeeId: number, areaId: number) => number | null;
  onSetRating: (employee: Employee, area: CompetencyArea, level: number | null) => void;
  onClose: () => void;
}) {
  const grouped = areas.reduce<Record<string, CompetencyArea[]>>((acc, area) => {
    const cat = area.category || "Ukategorisert";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(area);
    return acc;
  }, {});

  const allRatings = areas.map(a => getRating(employee.id, a.id)).filter((r): r is number => r !== null);
  const avgRating = allRatings.length > 0 ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1) : "—";
  const ratedCount = allRatings.length;

  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" onClick={onClose}>
      <div className="card-panel w-full max-w-lg mx-4 p-0 animate-slide-in-up max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 pb-4 border-b border-b-subtle flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-heading">Kompetanseprofil</h2>
            <button onClick={onClose} className="p-1 rounded text-muted hover:text-t-bright transition-colors"><X size={20} /></button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-fiber/10 border-2 border-fiber/30 flex items-center justify-center">
              <span className="font-mono text-lg text-fiber font-semibold">{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</span>
            </div>
            <div>
              <p className="text-t-bright font-medium text-lg">{employee.firstName} {employee.lastName}</p>
              <p className="text-muted text-sm">{employee.title || "Ingen tittel"}{employee.team ? ` · ${employee.team.name}` : ""}</p>
            </div>
          </div>
          <div className="flex gap-6 mt-4">
            <div>
              <span className="font-mono text-2xl text-fiber font-semibold">{ratedCount}</span>
              <span className="text-muted text-xs ml-1">/ {areas.length} vurdert</span>
            </div>
            <div>
              <span className="font-mono text-2xl text-signal font-semibold">{avgRating}</span>
              <span className="text-muted text-xs ml-1">snitt</span>
            </div>
          </div>
        </div>

        {/* Competency list */}
        <div className="overflow-y-auto flex-1 p-6 pt-4">
          {Object.entries(grouped).map(([category, catAreas]) => (
            <div key={category} className="mb-5 last:mb-0">
              <p className="font-mono text-[0.6rem] text-fiber/60 tracking-widest uppercase mb-2">{category}</p>
              <div className="space-y-1.5">
                {catAreas.map(area => {
                  const rating = getRating(employee.id, area.id);
                  return (
                    <button key={area.id}
                      onClick={() => onSetRating(employee, area, rating)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface/40 transition-colors group text-left"
                    >
                      <span className="text-sm text-t-default">{area.name}</span>
                      {rating ? (
                        <span className={`w-8 h-8 rounded-md border text-xs font-mono font-semibold flex items-center justify-center
                                        transition-all group-hover:scale-110 ${levelColors[rating]}`}>
                          {rating}
                        </span>
                      ) : (
                        <span className="w-8 h-8 rounded-md border border-dashed border-b-subtle text-muted/30 text-xs flex items-center justify-center
                                       group-hover:border-fiber/30 group-hover:text-fiber/50 transition-all">
                          +
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CompetenciesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [areas, setAreas] = useState<CompetencyArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingModal, setRatingModal] = useState<{ employee: Employee; area: CompetencyArea; level: number | null } | null>(null);
  const [areaModal, setAreaModal] = useState<{ open: boolean; area: CompetencyArea | null }>({ open: false, area: null });
  const [profileModal, setProfileModal] = useState<Employee | null>(null);

  const loadData = () => {
    Promise.all([api.getEmployees(), api.getCompetencyAreas()])
      .then(([emp, a]) => { setEmployees(emp); setAreas(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const getRating = (employeeId: number, areaId: number): number | null => {
    const emp = employees.find(e => e.id === employeeId);
    const rating = emp?.competencyRatings?.find((r: { competencyAreaId: number }) => r.competencyAreaId === areaId);
    return rating ? rating.level : null;
  };

  const handleSetRating = async (level: number) => {
    if (!ratingModal) return;
    try {
      await api.setCompetencyRating(ratingModal.employee.id, ratingModal.area.id, { level });
      setRatingModal(null);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleSaveArea = async (data: Partial<CompetencyArea>) => {
    try {
      if (areaModal.area) {
        await api.updateCompetencyArea(areaModal.area.id, data);
      } else {
        await api.createCompetencyArea(data);
      }
      setAreaModal({ open: false, area: null });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteArea = async (id: number) => {
    if (!confirm("Slette kompetanseområdet? Alle vurderinger fjernes.")) return;
    try { await api.deleteCompetencyArea(id); loadData(); }
    catch (err) { console.error(err); }
  };

  const filteredAreas = areas.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.category || "").toLowerCase().includes(search.toLowerCase())
  );

  // Group areas by category
  const grouped = filteredAreas.reduce<Record<string, CompetencyArea[]>>((acc, area) => {
    const cat = area.category || "Ukategorisert";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(area);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-fiber/30 border-t-fiber rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between animate-slide-in-up">
        <div>
          <h1 className="font-display text-3xl text-heading tracking-tight">Kompetansematrise</h1>
          <p className="text-muted mt-1">
            <span className="font-mono text-sm">{areas.length}</span> kompetanseområder · <span className="font-mono text-sm">{employees.length}</span> ansatte
          </p>
          <div className="fiber-line mt-3 w-40" />
        </div>
        <button onClick={() => setAreaModal({ open: true, area: null })} className="btn-fiber px-4 py-2.5 text-sm flex items-center gap-2">
          <Plus size={16} /> Nytt område
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs animate-slide-in-up stagger-1">
        <span className="text-muted">Nivå:</span>
        {[1, 2, 3, 4, 5].map(l => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded text-[0.55rem] font-mono font-semibold flex items-center justify-center border ${levelColors[l]}`}>{l}</span>
            <span className="text-muted">{levelLabels[l]}</span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm animate-slide-in-up stagger-2">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Søk kompetanseområder..."
          className="w-full pl-9 pr-3 py-2 bg-panel border border-b-subtle rounded-lg text-t-bright text-sm focus:outline-none focus:border-fiber/40 transition-colors placeholder:text-muted/50" />
      </div>

      {/* Matrix */}
      {employees.length > 0 && filteredAreas.length > 0 ? (
        <div className="card-panel overflow-x-auto animate-slide-in-up stagger-3">
          <table className="w-full">
            <thead>
              <tr className="border-b border-b-subtle">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted sticky left-0 bg-panel z-10 min-w-[200px]">
                  Kompetanseområde
                </th>
                {employees.map(emp => (
                  <th key={emp.id} className="px-2 py-3 text-center min-w-[72px]">
                    <button onClick={() => setProfileModal(emp)} className="group flex flex-col items-center gap-1.5 mx-auto hover:opacity-80 transition-opacity" title={`${emp.firstName} ${emp.lastName} – klikk for kompetanseprofil`}>
                      <div className="w-10 h-10 rounded-full bg-fiber/10 border-2 border-fiber/30 flex items-center justify-center group-hover:border-fiber/60 group-hover:bg-fiber/20 transition-all">
                        <span className="font-mono text-sm text-fiber font-semibold">{emp.firstName.charAt(0)}{emp.lastName.charAt(0)}</span>
                      </div>
                      <span className="text-[0.7rem] text-muted group-hover:text-t-bright transition-colors block truncate max-w-[70px] leading-tight">{emp.firstName}</span>
                    </button>
                  </th>
                ))}
                <th className="px-3 py-3 text-center min-w-[48px]">
                  <span className="text-[0.6rem] text-muted">Snitt</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([category, catAreas]) => (
                <>
                  <tr key={`cat-${category}`}>
                    <td colSpan={employees.length + 2} className="px-4 pt-4 pb-1">
                      <span className="font-mono text-[0.6rem] text-fiber/60 tracking-widest uppercase">{category}</span>
                    </td>
                  </tr>
                  {catAreas.map(area => {
                    const ratings = employees.map(e => getRating(e.id, area.id)).filter((r): r is number => r !== null);
                    const avg = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";
                    return (
                      <tr key={area.id} className="border-b border-b-subtle/30 hover:bg-surface/20 transition-colors group">
                        <td className="px-4 py-2 sticky left-0 bg-panel z-10">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-t-default">{area.name}</span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setAreaModal({ open: true, area })} className="p-0.5 rounded text-muted hover:text-fiber transition-colors"><Pencil size={11} /></button>
                              <button onClick={() => handleDeleteArea(area.id)} className="p-0.5 rounded text-muted hover:text-danger transition-colors"><Trash2 size={11} /></button>
                            </div>
                          </div>
                        </td>
                        {employees.map(emp => {
                          const rating = getRating(emp.id, area.id);
                          return (
                            <td key={emp.id} className="px-2 py-2 text-center">
                              {rating ? (
                                <LevelBadge level={rating} onClick={() => setRatingModal({ employee: emp, area, level: rating })} />
                              ) : (
                                <EmptyCell onClick={() => setRatingModal({ employee: emp, area, level: null })} />
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center">
                          <span className="font-mono text-sm text-muted">{avg}</span>
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 card-panel">
          <GraduationCap size={32} className="mx-auto text-muted/40 mb-3" />
          <p className="text-muted">
            {employees.length === 0 ? "Legg til ansatte først for å se kompetansematrisen" : "Ingen kompetanseområder matcher søket"}
          </p>
        </div>
      )}

      {/* Modals */}
      {ratingModal && (
        <RatingModal employee={ratingModal.employee} area={ratingModal.area} currentLevel={ratingModal.level}
          onSave={handleSetRating} onClose={() => setRatingModal(null)} />
      )}
      {areaModal.open && (
        <AreaModal area={areaModal.area} onSave={handleSaveArea} onClose={() => setAreaModal({ open: false, area: null })} />
      )}
      {profileModal && (
        <EmployeeProfileModal
          employee={profileModal}
          areas={areas}
          getRating={getRating}
          onSetRating={(emp, area, level) => {
            setProfileModal(null);
            setRatingModal({ employee: emp, area, level });
          }}
          onClose={() => setProfileModal(null)}
        />
      )}
    </div>
  );
}
