import { api } from './client';

export const setupWeixinBegin = () => api.post('/cc-connect/setup/weixin/begin');

export const setupWeixinPoll = (qrKey) => api.post('/cc-connect/setup/weixin/poll', { qr_key: qrKey });

export const getStatus = () => api.get('/cc-connect/status');

export const listSessions = (project) => api.get(`/cc-connect/projects/${project}/sessions`);

export const getSession = (project, id, historyLimit = 200) =>
  api.get(`/cc-connect/projects/${project}/sessions/${id}`, { history_limit: String(historyLimit) });