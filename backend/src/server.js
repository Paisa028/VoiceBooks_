// Loads environment variables from the backend .env file
require("dotenv").config();

// Imports Express
const express = require("express");

// Imports CORS
const cors = require("cors");

// Creates the Express application
const app = express();

// Port for the VoiceBooks backend
const PORT = process.env.PORT || 3715;

// Allows the frontend to communicate with the backend
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// Allows the API to receive JSON data
app.use(express.json());

// Basic VoiceBooks API route
app.get("/", (req, res) => {
  res.status(200).json({
    application: "VoiceBooks API",
    status: "running",
    port: PORT,
  });
});

// Starts the VoiceBooks backend
app.listen(PORT, () => {
  console.log(`VoiceBooks API running on http://localhost:${PORT}`);
});