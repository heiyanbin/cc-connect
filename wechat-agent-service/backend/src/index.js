const express = require('express');
const cors = require('cors');
const config = require('./config');

const agentsRouter = require('./routes/agents');
const projectsRouter = require('./routes/projects');
const ccConnectRouter = require('./routes/ccConnect');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/agents', agentsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/cc-connect', ccConnectRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(config.port, () => {
  console.log(`WeChat Agent Backend running on port ${config.port}`);
  console.log(`CC-Connect URL: ${config.ccConnectUrl}`);
});