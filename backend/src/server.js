// Loads environment variables from the backend .env file
require("dotenv").config();

// Imports the VoiceBooks Express application (routes and middleware live in app.js)
const app = require("./app");

// Imports the shared configuration
const { config } = require("./config");

async function start() {
  if (config.databaseProvider === 'firebase') {
    await require('./firebase/client').checkConnection();
  }
  app.listen(config.port, () => {
    console.log(`VoiceBooks API running on http://localhost:${config.port} (${config.databaseProvider})`);
  });
}
start().catch(error => {
  console.error(`Backend startup failed: ${error.message}`);
  process.exitCode = 1;
});
