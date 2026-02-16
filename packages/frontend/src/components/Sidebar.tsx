import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Network,
  GraduationCap,
  Rss,
  Radar,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", description: "Oversikt" },
  { to: "/employees", icon: Users, label: "Ansatte", description: "15 personer" },
  { to: "/teams", icon: Network, label: "Team", description: "2 team" },
  { to: "/competencies", icon: GraduationCap, label: "Kompetanse", description: "Matrise" },
  { to: "/news", icon: Rss, label: "Nyhetsfeed", description: "Bransje" },
  { to: "/radar", icon: Radar, label: "Teknologiradar", description: "Oversikt" },
  { to: "/documents", icon: FileText, label: "Dokumenter", description: "Confluence" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-deep border-r border-b-subtle flex flex-col z-50">
      {/* Logo area */}
      <div className="px-5 py-6 border-b border-b-subtle">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fiber to-signal flex items-center justify-center">
              <span className="font-mono text-void text-sm font-bold">FA</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-signal border-2 border-deep" 
                 style={{ animation: 'pulse-fiber 3s ease-in-out infinite' }} />
          </div>
          <div>
            <h1 className="font-display text-heading text-lg leading-tight tracking-tight">Controller</h1>
            <p className="font-mono text-[0.6rem] text-muted tracking-widest uppercase">NEAS Teknologi</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <p className="px-2 mb-3 font-mono text-[0.6rem] text-muted tracking-[0.2em] uppercase">Navigasjon</p>
        <ul className="space-y-0.5">
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.to || 
              (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <li key={item.to} className={`animate-slide-in-left stagger-${i + 1}`}>
                <NavLink
                  to={item.to}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-fiber-glow border border-fiber/20 text-fiber"
                      : "text-muted hover:text-t-bright hover:bg-surface/50"
                  }`}
                >
                  <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} 
                    className={isActive ? "text-fiber" : "text-muted group-hover:text-t-default"} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium block ${isActive ? "text-t-bright" : ""}`}>
                      {item.label}
                    </span>
                  </div>
                  {isActive && (
                    <ChevronRight size={14} className="text-fiber/60" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Status bar */}
      <div className="px-3 py-2 mx-3 mb-2 rounded-lg bg-surface/40">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-signal" style={{ animation: 'pulse-fiber 2s ease-in-out infinite' }} />
          <span className="font-mono text-[0.6rem] text-signal/80 tracking-wider uppercase">System Online</span>
        </div>
        <div className="fiber-line" />
      </div>

      {/* User section */}
      <div className="px-3 pb-4 pt-2 border-t border-b-subtle">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center border border-b-subtle">
            <span className="font-mono text-xs text-fiber font-medium">
              {user?.displayName?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-t-bright truncate">{user?.displayName}</p>
            <p className="font-mono text-[0.6rem] text-muted">Fagansvarlig</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            title="Logg ut"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
