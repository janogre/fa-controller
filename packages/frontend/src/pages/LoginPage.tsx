import { useState, FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(username, password);
    } catch {
      setError("Feil brukernavn eller passord");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
           style={{ background: 'radial-gradient(circle, rgba(0, 212, 255, 0.06) 0%, transparent 70%)' }} />

      {/* Login card */}
      <div className="relative w-full max-w-md mx-4 animate-slide-in-up">
        <div className="card-panel p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-fiber to-signal mb-4"
                 style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}>
              <span className="font-mono text-void text-xl font-bold">FA</span>
            </div>
            <h1 className="font-display text-2xl text-heading tracking-tight">FA-Controller</h1>
            <p className="font-mono text-xs text-muted mt-2 tracking-wider uppercase">
              NEAS Energi Telekom · Teknologi
            </p>
            <div className="fiber-line mt-4 mx-auto w-32" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-[0.7rem] text-muted tracking-wider uppercase mb-2">
                Brukernavn
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-b-subtle rounded-lg text-t-bright font-mono text-sm
                           focus:outline-none focus:border-fiber/40 focus:ring-1 focus:ring-fiber/20 transition-all
                           placeholder:text-muted/50"
                placeholder="admin"
                autoFocus
              />
            </div>

            <div>
              <label className="block font-mono text-[0.7rem] text-muted tracking-wider uppercase mb-2">
                Passord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-b-subtle rounded-lg text-t-bright font-mono text-sm
                           focus:outline-none focus:border-fiber/40 focus:ring-1 focus:ring-fiber/20 transition-all
                           placeholder:text-muted/50"
                placeholder="••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/20 animate-slide-in-up">
                <AlertCircle size={16} className="text-danger shrink-0" />
                <span className="text-sm text-danger">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full btn-fiber py-3 px-4 text-sm flex items-center justify-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-void/30 border-t-void rounded-full animate-spin" />
              ) : (
                <>
                  Logg inn
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="font-mono text-[0.6rem] text-muted/60 tracking-wider">
              v1.0 · Fagansvarlig Styringsverktøy
            </p>
          </div>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="fixed top-4 left-4 font-mono text-[0.6rem] text-muted/30 tracking-widest">
        SYS:READY
      </div>
      <div className="fixed bottom-4 right-4 font-mono text-[0.6rem] text-muted/30 tracking-widest">
        NODE:KRISTIANSUND
      </div>
    </div>
  );
}
