import { api } from './client';

export const createProject = (data) => api.post('/projects/create', data);

export const getUserProjects = (userId) => api.get(`/projects/${userId}`);