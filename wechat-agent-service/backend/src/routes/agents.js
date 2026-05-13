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

// Get agent template detail
router.get('/:name', async (req, res) => {
  try {
    const template = await agentTemplate.get(req.params.name);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({
      name: template.name,
      description: template.description,
      claude_md_content: template.claude_md_content
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;