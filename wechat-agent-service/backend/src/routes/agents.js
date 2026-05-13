const express = require('express');
const agentTemplate = require('../services/agentTemplate');

const router = express.Router();

// List all agent templates
router.get('/', async (req, res) => {
  try {
    const templates = await agentTemplate.listAll();
    res.json({
      agents: templates.map(t => ({
        name: t.name,
        description: t.description
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;