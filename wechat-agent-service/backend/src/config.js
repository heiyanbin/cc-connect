require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  ccConnectUrl: process.env.CC_CONNECT_URL || 'http://localhost:9820',
  ccConnectToken: process.env.CC_CONNECT_TOKEN || '',
  templatesDir: process.env.TEMPLATES_DIR || '../templates',
  workspacesDir: process.env.WORKSPACES_DIR || '../workspaces'
};