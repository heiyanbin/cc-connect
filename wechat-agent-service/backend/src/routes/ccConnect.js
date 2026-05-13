const express = require('express');
const ccConnect = require('../services/ccConnect');

const router = express.Router();

// Proxy setup/weixin/begin
router.post('/setup/weixin/begin', async (req, res) => {
  try {
    const result = await ccConnect.setupWeixinBegin();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy setup/weixin/poll
router.post('/setup/weixin/poll', async (req, res) => {
  try {
    const { qr_key } = req.body;
    if (!qr_key) {
      return res.status(400).json({ error: 'qr_key required' });
    }
    const result = await ccConnect.setupWeixinPoll(qr_key);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restart cc-connect (required for new projects)
router.post('/restart', async (req, res) => {
  try {
    const result = await ccConnect.restart();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cc-connect status (bridge config)
router.get('/status', async (req, res) => {
  try {
    const result = await ccConnect.getStatus();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List sessions for a project
router.get('/projects/:name/sessions', async (req, res) => {
  try {
    const result = await ccConnect.listSessions(req.params.name);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session details (with history)
router.get('/projects/:name/sessions/:id', async (req, res) => {
  try {
    const { history_limit } = req.query;
    const result = await ccConnect.getSession(req.params.name, req.params.id, history_limit);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new session
router.post('/sessions', async (req, res) => {
  try {
    const { project, session_key, name } = req.body;
    if (!project || !session_key) {
      return res.status(400).json({ error: 'project and session_key required' });
    }
    const result = await ccConnect.createSession(project, session_key, name);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;