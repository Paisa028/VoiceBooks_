import { useLocation, useNavigate } from "react-router-dom";

// --------------------------------------------------
// CLARIFICATION SCREEN
// --------------------------------------------------

function Clarification() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieves the information sent from VoiceCapture
  const transaction =
    location.state?.transaction || {};

  const missingFields =
    location.state?.missingFields || [];

  const questions =
    location.state?.questions || [];

  const transcript =
    location.state?.transcript ||
    transaction.originalTranscript ||
    "";

  // --------------------------------------------------
  // FIELD INFORMATION
  // --------------------------------------------------

  const fieldInformation = {
    type: {
      label: "Transaction Type",
      question: "Is this an income or an expense?",
    },

    amount: {
      label: "Amount",
      question: "What is the transaction amount?",
    },

    description: {
      label: "Description",
      question: "What is this transaction for?",
    },

    paymentMethod: {
      label: "Payment Method",
      question: "How was the transaction paid?",
    },

    party: {
      label: "Customer / Supplier",
      question: "Who is the customer or supplier?",
    },

    partyType: {
      label: "Party Type",
      question:
        "Is this party a customer or supplier?",
    },

    accountCategory: {
      label: "Account Category",
      question:
        "What account category should be used?",
    },

    transactionDate: {
      label: "Transaction Date",
      question:
        "What date did this transaction take place?",
    },
  };

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const goBack = () => {
    navigate(-1);
  };

  const enterManually = () => {
    navigate(
      "/transactions/manual",
      {
        state: {
          transaction: {
            ...transaction,
            originalTranscript: transcript,
          },

          clarification: true,

          missingFields,
        },
      }
    );
  };

  const respondWithVoice = () => {
    navigate(
      "/transactions/voice",
      {
        state: {
          clarificationMode: true,

          originalTransaction: transaction,

          originalTranscript: transcript,

          missingFields,

          questions,
        },
      }
    );
  };

  // --------------------------------------------------
  // SAFETY FALLBACK
  // --------------------------------------------------

  if (missingFields.length === 0) {
    return (
      <main className="transaction-page">
        <section className="transaction-container">

          <button
            type="button"
            className="transaction-back-button"
            onClick={goBack}
            aria-label="Go back"
          >
            ←
          </button>

          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
            }}
          >
            <h1>
              No Clarification Required
            </h1>

            <p>
              VoiceBooks already has the information
              required to continue this transaction.
            </p>

            <button
              type="button"
              className="success-primary-button"
              onClick={() =>
                navigate(
                  "/transactions/review",
                  {
                    state: {
                      transaction,
                    },
                  }
                )
              }
            >
              Continue to Review
            </button>
          </div>

        </section>
      </main>
    );
  }

  // Retrieves the first missing field
  const currentMissingField =
    missingFields[0];

  const currentFieldInformation =
    fieldInformation[currentMissingField];

  const clarificationQuestion =
    questions[0] ||
    currentFieldInformation?.question ||
    "Please provide the missing transaction information.";

  const missingFieldLabel =
    currentFieldInformation?.label ||
    "Transaction Detail";

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="transaction-page">

      <section className="transaction-container">

        {/* Back button */}
        <button
          type="button"
          className="transaction-back-button"
          onClick={goBack}
          aria-label="Go back"
        >
          ←
        </button>

        {/* Clarification card */}
        <div
          style={{
            maxWidth: "620px",
            margin: "20px auto 0",
          }}
        >

          {/* Warning heading */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
              padding: "22px",
              border: "1px solid #f1d78a",
              borderRadius: "14px",
              backgroundColor: "#fffaf0",
            }}
          >

            <div
              style={{
                width: "42px",
                height: "42px",
                minWidth: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                backgroundColor: "#fff0bd",
                fontSize: "20px",
              }}
            >
              !
            </div>

            <div>
              <h1
                style={{
                  margin: "0 0 6px",
                  color: "#10213b",
                  fontSize: "22px",
                }}
              >
                {missingFields.length === 1
                  ? "One detail is missing"
                  : `${missingFields.length} details are missing`}
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "#637083",
                  lineHeight: "1.5",
                }}
              >
                VoiceBooks needs the{" "}
                <strong>
                  {missingFieldLabel.toLowerCase()}
                </strong>{" "}
                to complete this entry.
              </p>
            </div>

          </div>

          {/* Question */}
          <div
            style={{
              marginTop: "20px",
              padding: "20px 22px",
              border: "1px solid #f1d78a",
              borderRadius: "12px",
              backgroundColor: "#fffdf6",
              color: "#805b00",
              fontSize: "17px",
              fontWeight: "600",
              lineHeight: "1.5",
            }}
          >
            {clarificationQuestion}
          </div>

          {/* Original transcription */}
          {transcript && (
            <div
              style={{
                marginTop: "22px",
                padding: "18px 20px",
                border: "1px solid #dfe7e3",
                borderRadius: "12px",
                backgroundColor: "#f8faf9",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  color: "#637083",
                  fontSize: "12px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Original Transcription
              </p>

              <p
                style={{
                  margin: 0,
                  color: "#10213b",
                  lineHeight: "1.6",
                }}
              >
                “{transcript}”
              </p>
            </div>
          )}

          {/* Missing information */}
          <div
            style={{
              marginTop: "22px",
              padding: "18px 20px",
              border: "1px solid #dfe7e3",
              borderRadius: "12px",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                color: "#10213b",
                fontWeight: "700",
              }}
            >
              Information still required
            </p>

            {missingFields.map(
              (field) => (
                <div
                  key={field}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "7px 0",
                    color: "#637083",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#e5a100",
                    }}
                  />

                  {fieldInformation[field]?.label ||
                    field}
                </div>
              )
            )}
          </div>

          {/* Respond with voice */}
          <button
            type="button"
            onClick={respondWithVoice}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "18px 20px",
              border: "none",
              borderRadius: "12px",
              backgroundColor: "#17613d",
              color: "#ffffff",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "17px",
                fontWeight: "700",
              }}
            >
              🎙 Respond with Voice
            </span>

            <span
              style={{
                display: "block",
                marginTop: "4px",
                opacity: 0.85,
                fontSize: "13px",
              }}
            >
              Provide the missing information by voice
            </span>
          </button>

          {/* Enter manually */}
          <button
            type="button"
            onClick={enterManually}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "18px 20px",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              color: "#10213b",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "17px",
                fontWeight: "700",
              }}
            >
              Enter Manually
            </span>

            <span
              style={{
                display: "block",
                marginTop: "4px",
                color: "#637083",
                fontSize: "13px",
              }}
            >
              Complete the missing information yourself
            </span>
          </button>

        </div>

      </section>

    </main>
  );
}

export default Clarification;