export interface Team {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  employees?: Employee[];
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  teamId: number | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  team?: Team;
  responsibilities?: Responsibility[];
  competencyRatings?: CompetencyRating[];
}

export interface Responsibility {
  id: number;
  employeeId: number;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface CompetencyArea {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  ratings?: CompetencyRating[];
}

export interface CompetencyRating {
  id: number;
  employeeId: number;
  competencyAreaId: number;
  level: number;
  notes: string | null;
  updatedAt: string;
  employee?: Employee;
  competencyArea?: CompetencyArea;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
}

export interface ActivityLogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  details: string | null;
  userId: number | null;
  createdAt: string;
}
