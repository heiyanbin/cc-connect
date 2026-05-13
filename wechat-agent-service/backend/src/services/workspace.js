const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const agentTemplate = require('./agentTemplate');

// Create workspace for user
async function create(projectName, agentName) {
  const workspacesPath = path.resolve(config.workspacesDir);
  const workspacePath = path.join(workspacesPath, projectName);

  // Create workspace directory
  await fs.ensureDir(workspacePath);

  // Copy agent template to workspace/.claude
  const template = await agentTemplate.get(agentName);
  if (template) {
    const claudeDestPath = path.join(workspacePath, '.claude');
    await fs.copy(template.path, claudeDestPath, {
      filter: (src) => !src.includes('meta.json') // Don't copy meta.json
    });
  }

  return workspacePath;
}

module.exports = {
  create
};