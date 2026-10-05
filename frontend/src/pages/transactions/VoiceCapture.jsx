import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

// --------------------------------------------------
// VOICE CAPTURE
// --------------------------------------------------

function VoiceCapture() {
  const navigate = useNavigate();
  const location = useLocation();

  // --------------------------------------------------
  // CLARIFICATION INFORMATION
  // --------------------------------------------------

  // If the user returned here from the Clarification
  // screen, these values contain the original transaction.
  const clarificationMode =
    location.state?.clarificationMode || false;

  const originalTransaction =
    location.state?.originalTransaction || null;

  const originalTranscript =
    location.state?.originalTranscript || "";

  const clarificationMissingFields =
    location.state?.missingFields || [];

  const clarificationQuestions =
    location.state?.questions || [];

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------
  

  // ready | recording | paused | stopped
  const [recordingStatus, setRecordingStatus] =
    useState("ready");

  const [seconds, setSeconds] = useState(0);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [audioUrl, setAudioUrl] =
    useState("");

  const [transcript, setTranscript] =
    useState("");

  const [isTranscribing, setIsTranscribing] =
    useState(false);

  const [isProcessing, setIsProcessing] =
    useState(false);

  // --------------------------------------------------
  // REFERENCES
  // --------------------------------------------------

  const mediaRecorderRef = useRef(null);

  const streamRef = useRef(null);

  const audioChunksRef = useRef([]);

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const goBack = () => {
    if (clarificationMode) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  // --------------------------------------------------
  // MICROPHONE
  // --------------------------------------------------

  const stopMicrophoneStream = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }
  };

  // --------------------------------------------------
  // TRANSCRIPTION
  // --------------------------------------------------

  const sendAudioForTranscription =
    async (audioBlob) => {
      try {
        setErrorMessage("");
        setIsTranscribing(true);

        const formData = new FormData();

        formData.append(
          "audio",
          audioBlob,
          "voicebooks-recording.webm"
        );

        const response = await fetch(
          "/api/transcriptions",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "The recording could not be transcribed."
          );
        }

        setTranscript(
          data.transcript || ""
        );
      } catch (error) {
        console.error(
          "Transcription request error:",
          error
        );

        setErrorMessage(
          error.message ||
            "VoiceBooks could not transcribe the recording. Please try again."
        );
      } finally {
        setIsTranscribing(false);
      }
    };

  // --------------------------------------------------
  // START RECORDING
  // --------------------------------------------------

  const startRecording = async () => {
    try {
      setErrorMessage("");
      setTranscript("");

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl("");
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable =
        (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(
              event.data
            );
          }
        };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type:
              mediaRecorder.mimeType ||
              "audio/webm",
          }
        );

        const newAudioUrl =
          URL.createObjectURL(audioBlob);

        setAudioUrl(newAudioUrl);

        stopMicrophoneStream();

        await sendAudioForTranscription(
          audioBlob
        );
      };

      mediaRecorder.start();

      setSeconds(0);
      setRecordingStatus("recording");
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      setErrorMessage(
        "VoiceBooks could not access your microphone. Please allow microphone access and try again."
      );

      setRecordingStatus("ready");
    }
  };

  // --------------------------------------------------
  // PAUSE
  // --------------------------------------------------

  const pauseRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state === "recording"
    ) {
      recorder.pause();
      setRecordingStatus("paused");
    }
  };

  // --------------------------------------------------
  // CONTINUE RECORDING
  // --------------------------------------------------

  const continueRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state === "paused"
    ) {
      recorder.resume();
      setRecordingStatus("recording");
    }
  };

  // --------------------------------------------------
  // STOP RECORDING
  // --------------------------------------------------

  const stopRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      (
        recorder.state === "recording" ||
        recorder.state === "paused"
      )
    ) {
      recorder.stop();
      setRecordingStatus("stopped");
    }
  };

  // --------------------------------------------------
  // DELETE / RESET RECORDING
  // --------------------------------------------------

  const deleteRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      (
        recorder.state === "recording" ||
        recorder.state === "paused"
      )
    ) {
      recorder.onstop = null;
      recorder.stop();
    }

    stopMicrophoneStream();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    audioChunksRef.current = [];
    mediaRecorderRef.current = null;

    setAudioUrl("");
    setTranscript("");
    setSeconds(0);
    setErrorMessage("");
    setIsTranscribing(false);
    setIsProcessing(false);
    setRecordingStatus("ready");
  };

  // --------------------------------------------------
  // TRANSCRIPT EDITING
  // --------------------------------------------------

  const handleTranscriptChange =
    (event) => {
      setTranscript(
        event.target.value
      );
    };

  // --------------------------------------------------
// NORMAL TRANSACTION PROCESSING
// --------------------------------------------------

const processNormalTransaction = async () => {
  const response = await fetch(
    "/api/transactions/process",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        transcript: transcript.trim(),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "The transaction could not be processed."
    );
  }

  // ----------------------------------------------
  // CLARIFICATION REQUIRED
  // ----------------------------------------------

    if (data.clarification?.needsClarification) {
    navigate("/transactions/clarification", {
      state: {
        transaction: data.transaction,

        transcript: transcript.trim(),

        missingFields:
          data.clarification.missingFields || [],

        questions:
          data.clarification.questions || [],
      },
    });

    return;
  }

  // ----------------------------------------------
  // COMPLETE TRANSACTION
  // ----------------------------------------------

  navigate("/transactions/review", {
    state: {
      transaction: data.transaction,
    },
  });
};

// --------------------------------------------------
// CLARIFICATION VOICE PROCESSING
// --------------------------------------------------

const processClarificationResponse = async () => {
  const answer = transcript.trim();

  if (!answer) {
    throw new Error(
      "Please provide the missing information."
    );
  }

  const fieldToUpdate =
    clarificationMissingFields[0];

  if (!fieldToUpdate) {
    navigate("/transactions/review", {
      state: {
        transaction: originalTransaction,
      },
    });

    return;
  }

  /*
   * Combine the original statement with the
   * clarification answer so the backend can
   * interpret the missing value.
   */
  const combinedTranscript = [
    originalTranscript,
    answer,
  ]
    .filter(Boolean)
    .join(". ");

  const response = await fetch(
    "/api/transactions/process",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        transcript: combinedTranscript,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "The clarification could not be processed."
    );
  }

  const processedTransaction =
    data.transaction || {};

  /*
   * Keep the original transaction.
   * Only the field currently being clarified
   * is allowed to change.
   */
  const mergedTransaction = {
    ...originalTransaction,

    originalTranscript: combinedTranscript,
  };

  const newValue =
    processedTransaction[fieldToUpdate];

  if (
    newValue !== null &&
    newValue !== undefined &&
    newValue !== ""
  ) {
    mergedTransaction[fieldToUpdate] =
      newValue;
  }

  /*
   * If the missing field is the party,
   * also preserve whether it is a customer
   * or supplier.
   */
  if (
    fieldToUpdate === "party" &&
    processedTransaction.partyType
  ) {
    mergedTransaction.partyType =
      processedTransaction.partyType;
  }

  // ----------------------------------------------
  // CHECK WHAT IS STILL MISSING
  // ----------------------------------------------

  const remainingMissingFields =
    clarificationMissingFields.filter(
      (field) => {
        const value =
          mergedTransaction[field];

        return (
          value === null ||
          value === undefined ||
          value === ""
        );
      }
    );

  // ----------------------------------------------
  // MORE INFORMATION IS STILL REQUIRED
  // ----------------------------------------------

  if (remainingMissingFields.length > 0) {
    const questionMap = {
      type:
        "Is this an income or an expense?",

      amount:
        "What is the transaction amount?",

      description:
        "What is this transaction for?",

      paymentMethod:
        "How was the transaction paid?",

      party:
        "Who is the customer or supplier?",

      transactionDate:
        "What date did this transaction take place?",
    };

    navigate("/transactions/clarification", {
      state: {
        transaction: mergedTransaction,

        transcript: combinedTranscript,

        missingFields:
          remainingMissingFields,

        questions:
          remainingMissingFields.map(
            (field) =>
              questionMap[field] ||
              "Please provide the missing information."
          ),
      },
    });

    return;
  }

  // ----------------------------------------------
  // CLARIFICATION COMPLETE
  // ----------------------------------------------

  navigate("/transactions/review", {
    state: {
      transaction: mergedTransaction,
    },
  });
};
  // --------------------------------------------------
  // CONTINUE BUTTON
  // --------------------------------------------------

  const continueToTransactionReview =
    async () => {
      try {
        setErrorMessage("");

        if (!transcript.trim()) {
          setErrorMessage(
            "Please record or enter a transaction before continuing."
          );

          return;
        }

        setIsProcessing(true);

        if (clarificationMode) {
          await processClarificationResponse();
        } else {
          await processNormalTransaction();
        }
      } catch (error) {
        console.error(
          "Transaction processing request error:",
          error
        );

        setErrorMessage(
          error.message ||
            "VoiceBooks could not process the transaction. Please try again."
        );
      } finally {
        setIsProcessing(false);
      }
    };

  // --------------------------------------------------
  // TIMER
  // --------------------------------------------------

  useEffect(() => {
    let timer;

    if (
      recordingStatus === "recording"
    ) {
      timer = setInterval(() => {
        setSeconds(
          (currentSeconds) =>
            currentSeconds + 1
        );
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [recordingStatus]);

  // --------------------------------------------------
  // PAGE CLEANUP
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      stopMicrophoneStream();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // --------------------------------------------------
  // TIME FORMAT
  // --------------------------------------------------

  const formatTime = (
    totalSeconds
  ) => {
    const minutes = Math.floor(
      totalSeconds / 60
    );

    const remainingSeconds =
      totalSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // --------------------------------------------------
  // UI TEXT
  // --------------------------------------------------

  const pageTitle =
    clarificationMode
      ? "Voice Clarification"
      : "Voice Capture";

  const pageIntroduction =
    clarificationMode
      ? "Provide the missing information for your transaction."
      : "Record a transaction using the VoiceBooks voice capture feature.";

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="transaction-page">
      <section className="transaction-container">

        {/* Header */}
        <header className="transaction-header">
          <button
            type="button"
            className="back-button"
            onClick={goBack}
            aria-label="Go back"
          >
            ←
          </button>

          <h1>{pageTitle}</h1>
        </header>

        <p className="transaction-intro">
          {pageIntroduction}
        </p>

        {/* Clarification information */}
        {clarificationMode && (
          <section
            style={{
              marginBottom: "24px",
              padding: "18px 20px",
              border:
                "1px solid #f1d78a",
              borderRadius: "12px",
              backgroundColor:
                "#fffaf0",
            }}
          >
            <strong
              style={{
                color: "#805b00",
              }}
            >
              Information required
            </strong>

            {clarificationQuestions
              .length > 0 && (
              <p
                style={{
                  margin:
                    "8px 0 0",
                  color: "#637083",
                  lineHeight: "1.5",
                }}
              >
                {
                  clarificationQuestions[
                    0
                  ]
                }
              </p>
            )}

            {clarificationMissingFields
              .length > 1 && (
              <p
                style={{
                  margin:
                    "8px 0 0",
                  color: "#637083",
                  fontSize: "13px",
                }}
              >
                VoiceBooks may ask for
                additional details after
                this response.
              </p>
            )}
          </section>
        )}

        {/* Main voice area */}
        <section className="voice-capture-area">

          <h2>
            {clarificationMode
              ? "Provide Missing Information"
              : "Describe Your Transaction"}
          </h2>

          <p>
            {clarificationMode
              ? "Answer the question above using a short, clear sentence."
              : "Describe the transaction in your own words. Include any details you remember."}
          </p>

          {/* Normal examples */}
          {!clarificationMode && (
            <div className="voice-examples">

              <p className="example-title">
                <strong>
                  Example transactions:
                </strong>
              </p>

              <ul>
                <li>
                  "I received R850 cash
                  from John for plumbing
                  services."
                </li>

                <li>
                  "I bought stationery
                  from CNA for R250 cash."
                </li>

                <li>
                  "I paid R1,200 for
                  electricity from the
                  business bank account."
                </li>
              </ul>

              <p className="voice-other-option">
                You can also describe any
                other transaction in your
                own words.
              </p>

            </div>
          )}

          {/* Original transaction during clarification */}
          {clarificationMode &&
            originalTranscript && (
              <div className="voice-examples">

                <p className="example-title">
                  <strong>
                    Original transaction:
                  </strong>
                </p>

                <p>
                  “{originalTranscript}”
                </p>

              </div>
            )}

          {/* Error */}
          {errorMessage && (
            <p className="recording-error">
              {errorMessage}
            </p>
          )}

          {/* Recorder */}
          <div className="recorder-panel">

            {/* READY */}
            {recordingStatus ===
              "ready" && (
              <>
                <button
                  type="button"
                  className="microphone-button microphone-ready"
                  onClick={
                    startRecording
                  }
                  aria-label="Start recording"
                >
                  🎙️
                </button>

                <p className="recorder-status">
                  {clarificationMode
                    ? "Tap to answer"
                    : "Tap to start recording"}
                </p>
              </>
            )}

            {/* RECORDING */}
            {recordingStatus ===
              "recording" && (
              <>
                <div
                  className="microphone-button microphone-recording"
                  aria-hidden="true"
                >
                  🎙️
                </div>

                <div className="recording-indicator">
                  <span className="recording-dot" />
                  Recording
                </div>

                <p className="recording-time">
                  {formatTime(seconds)}
                </p>

                <div className="recorder-controls">

                  <button
                    type="button"
                    onClick={
                      pauseRecording
                    }
                  >
                    ⏸ Pause
                  </button>

                  <button
                    type="button"
                    onClick={
                      stopRecording
                    }
                  >
                    ⏹ Stop
                  </button>

                  <button
                    type="button"
                    onClick={
                      deleteRecording
                    }
                  >
                    🗑 Delete
                  </button>

                </div>
              </>
            )}

            {/* PAUSED */}
            {recordingStatus ===
              "paused" && (
              <>
                <div
                  className="microphone-button microphone-paused"
                  aria-hidden="true"
                >
                  🎙️
                </div>

                <p className="recorder-status">
                  Recording paused
                </p>

                <p className="recording-time">
                  {formatTime(seconds)}
                </p>

                <div className="recorder-controls">

                  <button
                    type="button"
                    onClick={
                      continueRecording
                    }
                  >
                    ▶ Continue
                  </button>

                  <button
                    type="button"
                    onClick={
                      stopRecording
                    }
                  >
                    ⏹ Stop
                  </button>

                  <button
                    type="button"
                    onClick={
                      deleteRecording
                    }
                  >
                    🗑 Delete
                  </button>

                </div>
              </>
            )}

            {/* STOPPED */}
            {recordingStatus ===
              "stopped" && (
              <>
                <p className="recorder-status">
                  Recording complete
                </p>

                <p className="recording-time">
                  {formatTime(seconds)}
                </p>

                {/* Playback */}
                {audioUrl && (
                  <audio
                    className="recording-playback"
                    controls
                    src={audioUrl}
                  >
                    Your browser does not
                    support audio playback.
                  </audio>
                )}

                {/* Transcript */}
                <div className="transcription-section">

                  <label
                    htmlFor="transaction-transcript"
                    className="transcription-label"
                  >
                    {clarificationMode
                      ? "Clarification Transcript"
                      : "Transaction Transcript"}
                  </label>

                  {isTranscribing && (
                    <p className="transcription-help">
                      Transcribing your
                      recording...
                    </p>
                  )}

                  <textarea
                    id="transaction-transcript"
                    className="transcription-textarea"
                    value={transcript}
                    onChange={
                      handleTranscriptChange
                    }
                    placeholder={
                      isTranscribing
                        ? "Transcribing your recording..."
                        : clarificationMode
                          ? "Your clarification will appear here..."
                          : "Your transaction transcription will appear here..."
                    }
                    rows="5"
                    disabled={
                      isTranscribing ||
                      !transcript
                    }
                  />

                  <p className="transcription-help">
                    Review the transcription
                    before continuing. You
                    can correct any details
                    that were not captured
                    accurately.
                  </p>

                </div>

                {/* Controls */}
                <div className="recorder-controls">

                  <button
                    type="button"
                    onClick={
                      deleteRecording
                    }
                    disabled={
                      isProcessing
                    }
                  >
                    🗑 Delete
                  </button>

                  <button
                    type="button"
                    onClick={
                      deleteRecording
                    }
                    disabled={
                      isProcessing
                    }
                  >
                    Record Again
                  </button>

                  <button
                    type="button"
                    onClick={
                      continueToTransactionReview
                    }
                    disabled={
                      isTranscribing ||
                      isProcessing ||
                      !transcript.trim()
                    }
                  >
                    {isProcessing
                      ? "Processing..."
                      : clarificationMode
                        ? "Submit Answer"
                        : "Continue"}
                  </button>

                </div>
              </>
            )}

          </div>
        </section>

        {/* Privacy */}
        <p className="voice-privacy">
          Your recording will only be
          used to process this
          transaction.
        </p>

      </section>
    </main>
    );
}

// Exports the Voice Capture component
export default VoiceCapture;