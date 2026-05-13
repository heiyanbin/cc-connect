const express = require('express');
const workspace = require('../services/workspace');
const ccConnect = require('../services/ccConnect');

const router = express.Router();

// Default project settings for new users
const DEFAULT_PROJECT_SETTINGS = {
  language: 'zh',
  show_context_indicator: false,
  reply_footer: false,
};

// Create user project
router.post('/create', async (req, res) => {
  try {
    const { agent_name, bot_token, ilink_bot_id, ilink_user_id, base_url } = req.body;

    if (!agent_name || !bot_token || !ilink_user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create project name: {user_id}-{agent_name}
    const projectName = `${ilink_user_id}-${agent_name}`;

    // Create workspace directory
    const workDir = await workspace.create(projectName, agent_name);

    // Call cc-connect to create project
    const saveResult = await ccConnect.setupWeixinSave({
      project: projectName,
      token: bot_token,
      ilink_bot_id: ilink_bot_id || '',
      ilink_user_id,
      work_dir: workDir,
      agent_type: 'claudecode'
    });

    // Restart cc-connect (required for new project to be loaded)
    if (saveResult.restart_required) {
      await ccConnect.restart();
      // Wait for cc-connect to be ready before applying settings
      await ccConnect.waitForReady();
    }

    // Apply default project settings
    await ccConnect.updateProjectSettings(projectName, DEFAULT_PROJECT_SETTINGS);

    res.json({
      project_name: projectName,
      work_dir: workDir,
      status: 'created',
      restart_required: false  // Already restarted
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's project info
router.get('/:userId', async (req, res) => {
  try {
    const projects = await ccConnect.listProjects();
    // Find projects matching this user
    const userProjects = projects.projects.filter(p =>
      p.name.startsWith(req.params.userId)
    );
    res.json({ projects: userProjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;