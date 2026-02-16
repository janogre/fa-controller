import { Construction } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="space-y-5">
      <div className="animate-slide-in-up">
        <h1 className="font-display text-3xl text-heading tracking-tight">Dokumenter</h1>
        <p className="text-muted mt-1">Confluence-integrasjon – dokumenter og møtenotater</p>
        <div className="fiber-line mt-3 w-32" />
      </div>
      <div className="card-panel p-12 text-center animate-slide-in-up stagger-1">
        <div className="w-16 h-16 rounded-xl bg-signal/10 flex items-center justify-center mx-auto mb-4">
          <Construction size={28} className="text-signal" />
        </div>
        <h2 className="font-display text-xl text-heading mb-2">Under utvikling</h2>
        <p className="text-muted text-sm max-w-md mx-auto">
          Confluence Cloud-integrasjon kommer i Fase 6. Her vil du kunne se og søke i 
          dokumenter, møtenotater og prosedyrer direkte fra FA-Controller.
        </p>
      </div>
    </div>
  );
}
