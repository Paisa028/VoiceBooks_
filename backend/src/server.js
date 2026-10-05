// Loads environment variables from the backend .env file
require("dotenv").config();

// Imports the VoiceBooks Express application (routes and middleware live in app.js)
const app = require("./app");

// Imports the shared configuration
const { config } = require("./config");

// Starts the VoiceBooks backend
app.listen(config.port, () => {
  console.log(`VoiceBooks API running on http://localhost:${config.port}`);
});
