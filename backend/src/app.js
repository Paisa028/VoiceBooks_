
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");

const { config } = require("./config.js");

const {
  errorHandler,
  notFound,
} = require("./middleware/errorHandler.js");

const adminRoutes = require("./routes/admin.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const onboardingRoutes = require("./routes/onboarding.routes.js");
const accountantRoutes = require("./routes/accountantRoutes.js");

const transcriptionRoutes = require("./routes/transcriptionRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const settingsRoutes = require("./routes/settings.routes.js");

// Sage Accounting OAuth integration
const sageRoutes = require("./routes/sage.routes.js");

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    application: "VoiceBooks API",
    status: "running",
    port: config.port,
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    databaseProvider: config.databaseProvider,
  });
});

// Authentication and onboarding
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/admin", adminRoutes);

// Accountant workspace
app.use("/api/accountant", accountantRoutes);

// Voice transactions
app.use("/api/transcriptions", transcriptionRoutes);
app.use("/api/transactions", transactionRoutes);

// Business settings
app.use("/api/settings", settingsRoutes);

// Sage Accounting integration
app.use("/api/sage", sageRoutes);

app.use("/api", notFound);
app.use(errorHandler);

module.exports = app;
