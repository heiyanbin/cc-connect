const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

// Create workspace for user
async function create(projectName, agentName) {
  const workspacesPath = path.resolve(config.workspacesDir);
  const workspacePath = path.join(workspacesPath, projectName);

  // Create workspace directory
  await fs.ensureDir(workspacePath);

  // Find agent template and copy .claude directory
  const templatesPath = path.resolve(config.templatesDir);
  const dirs = await fs.readdir(templatesPath);

  for (const dir of dirs) {
    const templatePath = path.join(templatesPath, dir);
    const metaPath = path.join(templatePath, 'meta.json');

    if (await fs.exists(metaPath)) {
      const meta = await fs.readJson(metaPath);
      if (meta.name === agentName || dir === agentName) {
        const claudeSrcPath = path.join(templatePath, '.claude');
        if (await fs.exists(claudeSrcPath)) {
          const claudeDestPath = path.join(workspacePath, '.claude');
          await fs.copy(claudeSrcPath, claudeDestPath);
        }
        break;
      }
    }
  }

  return workspacePath;
}

module.exports = {
  create
};