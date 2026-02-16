const API_BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: number; username: string; displayName: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ id: number; username: string; displayName: string }>("/auth/me"),

  // Employees
  getEmployees: () => request<any[]>("/employees"),
  getEmployee: (id: number) => request<any>(`/employees/${id}`),
  createEmployee: (data: any) => request<any>("/employees", { method: "POST", body: JSON.stringify(data) }),
  updateEmployee: (id: number, data: any) => request<any>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEmployee: (id: number) => request<any>(`/employees/${id}`, { method: "DELETE" }),
  addResponsibility: (employeeId: number, data: any) =>
    request<any>(`/employees/${employeeId}/responsibilities`, { method: "POST", body: JSON.stringify(data) }),
  deleteResponsibility: (employeeId: number, respId: number) =>
    request<any>(`/employees/${employeeId}/responsibilities/${respId}`, { method: "DELETE" }),
  setCompetencyRating: (employeeId: number, areaId: number, data: { level: number; notes?: string }) =>
    request<any>(`/employees/${employeeId}/competencies/${areaId}`, { method: "PUT", body: JSON.stringify(data) }),

  // Teams
  getTeams: () => request<any[]>("/teams"),
  getTeam: (id: number) => request<any>(`/teams/${id}`),
  createTeam: (data: any) => request<any>("/teams", { method: "POST", body: JSON.stringify(data) }),
  updateTeam: (id: number, data: any) => request<any>(`/teams/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTeam: (id: number) => request<any>(`/teams/${id}`, { method: "DELETE" }),

  // Competency Areas
  getCompetencyAreas: () => request<any[]>("/competencies"),
  getCompetencyArea: (id: number) => request<any>(`/competencies/${id}`),
  createCompetencyArea: (data: any) => request<any>("/competencies", { method: "POST", body: JSON.stringify(data) }),
  updateCompetencyArea: (id: number, data: any) => request<any>(`/competencies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCompetencyArea: (id: number) => request<any>(`/competencies/${id}`, { method: "DELETE" }),

  // News
  getNewsSources: () => request<any[]>("/news/sources"),
  createNewsSource: (data: any) => request<any>("/news/sources", { method: "POST", body: JSON.stringify(data) }),
  updateNewsSource: (id: number, data: any) => request<any>(`/news/sources/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteNewsSource: (id: number) => request<any>(`/news/sources/${id}`, { method: "DELETE" }),
  getNewsArticles: (params?: { category?: string; bookmarked?: boolean; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.bookmarked) query.set("bookmarked", "true");
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const qs = query.toString();
    return request<any[]>(`/news/articles${qs ? `?${qs}` : ""}`);
  },
  toggleBookmark: (articleId: number) => request<any>(`/news/articles/${articleId}/bookmark`, { method: "PATCH" }),
  markAsRead: (articleId: number) => request<any>(`/news/articles/${articleId}/read`, { method: "PATCH" }),
  updateArticleNotes: (articleId: number, notes: string) =>
    request<any>(`/news/articles/${articleId}/notes`, { method: "PATCH", body: JSON.stringify({ notes }) }),
  fetchAllFeeds: () => request<any>("/news/fetch", { method: "POST" }),
  fetchSource: (sourceId: number) => request<any>(`/news/fetch/${sourceId}`, { method: "POST" }),

  // Radar
  getRadarBlips: () => request<any[]>("/radar"),
  getRadarBlip: (id: number) => request<any>(`/radar/${id}`),
  createRadarBlip: (data: any) => request<any>("/radar", { method: "POST", body: JSON.stringify(data) }),
  updateRadarBlip: (id: number, data: any) => request<any>(`/radar/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRadarBlip: (id: number) => request<any>(`/radar/${id}`, { method: "DELETE" }),
  getBlipHistory: (blipId: number) => request<any[]>(`/radar/${blipId}/history`),
};
