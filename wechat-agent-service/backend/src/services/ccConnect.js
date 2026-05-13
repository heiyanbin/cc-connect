const axios = require('axios');
const config = require('../config');

const api = axios.create({
  baseURL: `${config.ccConnectUrl}/api/v1`,
  headers: { Authorization: `Bearer ${config.ccConnectToken}` },
  timeout: 30000
});

// URL encode project name (may contain @ symbol)
function encodeProjectName(name) {
  return encodeURIComponent(name);
}

// Wait for cc-connect to be ready after restart
function waitForReady(maxRetries = 10, delayMs = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = async () => {
      try {
        await api.get('/status');
        resolve();
      } catch (err) {
        retries++;
        if (retries >= maxRetries) {
          reject(new Error('cc-connect not ready after restart'));
        } else {
          setTimeout(check, delayMs);
        }
      }
    };
    check();
  });
}

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
  const res = await api.get(`/projects/${encodeProjectName(name)}`);
  return res.data.data || res.data;
}

// List all projects
async function listProjects() {
  const res = await api.get('/projects');
  return res.data.data || res.data;
}

// List sessions for a project
async function listSessions(name) {
  const res = await api.get(`/projects/${encodeProjectName(name)}/sessions`);
  return res.data.data || res.data;
}

// Get session details (with history)
async function getSession(name, id, historyLimit = 200) {
  const res = await api.get(`/projects/${encodeProjectName(name)}/sessions/${id}`, {
    params: { history_limit: historyLimit }
  });
  return res.data.data || res.data;
}

// Create new session - calls BridgeServer on port 9810
async function createSession(project, sessionKey, name = 'default') {
  // Get bridge config from status (port and token)
  const status = await getStatus();
  if (!status.bridge?.enabled) {
    throw new Error('Bridge not enabled');
  }
  const bridgePort = status.bridge.port || 9810;
  const bridgeToken = status.bridge.token;

  // Call BridgeServer directly
  const bridgeApi = axios.create({
    baseURL: `http://localhost:${bridgePort}`,
    headers: { Authorization: `Bearer ${bridgeToken}` },
    timeout: 30000
  });
  const res = await bridgeApi.post('/bridge/sessions', {
    project,
    session_key: sessionKey,
    name
  });
  return res.data;
}

// Update project settings
async function updateProjectSettings(projectName, settings) {
  const res = await api.patch(`/projects/${encodeProjectName(projectName)}`, settings);
  return res.data.data || res.data;
}

module.exports = {
  setupWeixinBegin,
  setupWeixinPoll,
  setupWeixinSave,
  reload,
  restart,
  waitForReady,
  getStatus,
  getProject,
  listProjects,
  listSessions,
  getSession,
  createSession,
  updateProjectSettings
};