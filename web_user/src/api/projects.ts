import api from './client';

export interface ProjectSummary {
  name: string;
  agent_type: string;
  platforms?: string[];
  sessions_count?: number;
}

export interface ProjectsResponse {
  projects: ProjectSummary[];
}

export const listProjects = (): Promise<ProjectsResponse> =>
  api.get<ProjectsResponse>('/projects');