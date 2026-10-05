// Imports the Deepgram SDK
const { DeepgramClient } = require("@deepgram/sdk");

// Creates the Deepgram client using the API key stored in .env
const deepgram = new DeepgramClient({
  apiKey: process.env.DEEPGRAM_API_KEY,
});

// Processes an uploaded audio recording and converts speech to text
const transcribeAudio = async (audioFile) => {
  // Ensures that an audio recording was provided
  if (!audioFile || !audioFile.buffer) {
    throw new Error("An audio recording is required.");
  }

  // Sends the audio recording to Deepgram for transcription
  const response = await deepgram.listen.v1.media.transcribeFile(
    audioFile.buffer,
    {
      model: "nova-3",
      smart_format: true,
    }
  );

  // Retrieves the transcript from the Deepgram response
  const transcript =
    response?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

  // Returns the transcription to the controller
  return {
    transcript,
  };
};

module.exports = {
  transcribeAudio,
};