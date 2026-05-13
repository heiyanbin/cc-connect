const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

// List all agent templates
async function listAll() {
  const templatesPath = path.resolve(config.templatesDir);
  const dirs = await fs.readdir(templatesPath);

  const templates = [];
  for (const dir of dirs) {
    const templatePath = path.join(templatesPath, dir);
    const stat = await fs.stat(templatePath);
    if (!stat.isDirectory()) continue;

    // Check for CLAUDE.md or meta.json
    const claudePath = path.join(templatePath, 'CLAUDE.md');
    const metaPath = path.join(templatePath, 'meta.json');

    let description = '';
    if (await fs.exists(metaPath)) {
      const meta = await fs.readJson(metaPath);
      description = meta.description || '';
    } else if (await fs.exists(claudePath)) {
      // Read first line as description
      const content = await fs.readFile(claudePath, 'utf-8');
      const firstLine = content.split('\n')[0];
      description = firstLine.replace(/^#+\s*/, '').trim();
    }

    templates.push({
      name: dir,
      description,
      path: templatePath
    });
  }

  return templates;
}

// Get a specific template
async function get(name) {
  const templatePath = path.join(path.resolve(config.templatesDir), name);
  if (!await fs.exists(templatePath)) {
    return null;
  }

  const claudePath = path.join(templatePath, 'CLAUDE.md');
  const metaPath = path.join(templatePath, 'meta.json');

  let description = '';
  let claudeContent = '';

  if (await fs.exists(metaPath)) {
    const meta = await fs.readJson(metaPath);
    description = meta.description || '';
  }

  if (await fs.exists(claudePath)) {
    claudeContent = await fs.readFile(claudePath, 'utf-8');
    if (!description) {
      const firstLine = claudeContent.split('\n')[0];
      description = firstLine.replace(/^#+\s*/, '').trim();
    }
  }

  return {
    name,
    description,
    claude_md_content: claudeContent,
    path: templatePath
  };
}

module.exports = {
  listAll,
  get
};