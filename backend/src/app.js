const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { config } = require('./config.js');
const { errorHandler, notFound } = require('./middleware/errorHandler.js');
const adminRoutes = require('./routes/admin.routes.js');
const authRoutes = require('./routes/auth.routes.js');
const onboardingRoutes = require('./routes/onboarding.routes.js');
const accountantRoutes = require('./routes/accountantRoutes.js');
const transcriptionRoutes = require("./routes/transcriptionRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const settingsRoutes = require('./routes/settings.routes.js');

// Creates the Express application
const app = express();
app.disable('x-powered-by');

// Adds standard security headers
app.use(helmet());

// Allows the frontend to communicate with the backend (credentials lets the login cookie through)
app.use(cors({ origin: config.clientOrigin, credentials: true }));

// Allows the API to receive JSON data (small limit, auth payloads are tiny)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Basic VoiceBooks API route
app.get('/', (req, res) => {
  res.status(200).json({
    application: 'VoiceBooks API',
    status: 'running',
    port: config.port,
  });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Authentication, user accounts and onboarding
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', adminRoutes);
// Accountant workspace
app.use('/api/accountant', accountantRoutes);
// Voice transactions
app.use('/api/transcriptions', transcriptionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/settings', settingsRoutes);

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
