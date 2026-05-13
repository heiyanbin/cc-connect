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

    // Read meta.json for name and description
    const metaPath = path.join(templatePath, 'meta.json');
    if (!await fs.exists(metaPath)) continue;

    const meta = await fs.readJson(metaPath);
    templates.push({
      name: meta.name || dir,
      description: meta.description || '',
      path: templatePath
    });
  }

  return templates;
}

// Get a specific template
async function get(name) {
  const templatesPath = path.resolve(config.templatesDir);
  const dirs = await fs.readdir(templatesPath);

  for (const dir of dirs) {
    const templatePath = path.join(templatesPath, dir);
    const metaPath = path.join(templatePath, 'meta.json');

    if (await fs.exists(metaPath)) {
      const meta = await fs.readJson(metaPath);
      if (meta.name === name || dir === name) {
        return {
          name: meta.name || dir,
          description: meta.description || '',
          path: templatePath
        };
      }
    }
  }

  return null;
}

module.exports = {
  listAll,
  get
};