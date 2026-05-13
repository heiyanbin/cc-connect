const axios = require('axios');
const config = require('../config');

const api = axios.create({
  baseURL: `${config.ccConnectUrl}/api/v1`,
  headers: { Authorization: `Bearer ${config.ccConnectToken}` },
  timeout: 30000
});

// Setup Weixin begin - generate QR
async function setupWeixinBegin() {
  const res = await api.post('/setup/weixin/begin');
  return res.data.data || res.data;
}

// Setup Weixin poll - check QR scan status
async function setupWeixinPoll(qrKey) {
  const res = await api.post('/setup/weixin/poll', { qr_key: qrKey });
  return res.data.data || res.data;
}

// Setup Weixin save - create project
async function setupWeixinSave(data) {
  const res = await api.post('/setup/weixin/save', data);
  return res.data.data || res.data;
}

// Reload cc-connect config
async function reload() {
  const res = await api.post('/reload');
  return res.data.data || res.data;
}

// Restart cc-connect process (required for new projects)
async function restart() {
  const res = await api.post('/restart');
  return res.data.data || res.data;
}

// Get status (bridge config)
async function getStatus() {
  const res = await api.get('/status');
  return res.data.data || res.data;
}

// Get project info
async function getProject(name) {
  const res = await api.get(`/projects/${name}`);
  return res.data.data || res.data;
}

// List all projects
async function listProjects() {
  const res = await api.get('/projects');
  return res.data.data || res.data;
}

// List sessions for a project
async function listSessions(name) {
  const res = await api.get(`/projects/${name}/sessions`);
  return res.data.data || res.data;
}

// Get session details (with history)
async function getSession(name, id, historyLimit = 200) {
  const res = await api.get(`/projects/${name}/sessions/${id}`, {
    params: { history_limit: historyLimit }
  });
  return res.data.data || res.data;
}

module.exports = {
  setupWeixinBegin,
  setupWeixinPoll,
  setupWeixinSave,
  reload,
  restart,
  getStatus,
  getProject,
  listProjects,
  listSessions,
  getSession
};