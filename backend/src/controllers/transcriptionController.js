// Imports the transcription service containing the processing logic
const transcriptionService = require("../services/transcriptionService");

// Handles requests to transcribe a voice recording
const createTranscription = async (req, res) => {
  try {
    // Retrieves the uploaded audio file
    const audioFile = req.file;

    // Validates that an audio recording was provided
    if (!audioFile) {
      return res.status(400).json({
        status: "error",
        message: "An audio recording is required.",
      });
    }

    // Sends the audio to the transcription service
    const result = await transcriptionService.transcribeAudio(audioFile);

    // Returns the transcription result
    return res.status(200).json({
      status: "success",
      transcript: result.transcript,
    });
  } catch (error) {
    console.error("Transcription error:", error);

    return res.status(500).json({
      status: "error",
      message: "The recording could not be transcribed.",
    });
  }
};

module.exports = {
  createTranscription,
};