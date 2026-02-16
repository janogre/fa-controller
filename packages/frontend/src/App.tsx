import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import TeamsPage from "./pages/TeamsPage";
import CompetenciesPage from "./pages/CompetenciesPage";
import NewsPage from "./pages/NewsPage";
import RadarPage from "./pages/RadarPage";
import DocumentsPage from "./pages/DocumentsPage";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-void">
      <Sidebar />
      <main className="ml-64 p-6 lg:p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void">
        <div className="w-6 h-6 border-2 border-fiber/30 border-t-fiber rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
      <Route path="/competencies" element={<ProtectedRoute><CompetenciesPage /></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute><NewsPage /></ProtectedRoute>} />
      <Route path="/radar" element={<ProtectedRoute><RadarPage /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
    </Routes>
  );
}
