const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { corsOrigin } = require('./config');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({ origin: corsOrigin.split(','), credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
