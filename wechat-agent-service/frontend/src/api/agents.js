import { api } from './client';

export const listAgents = () => api.get('/agents');

export const getAgent = (name) => api.get(`/agents/${name}`);