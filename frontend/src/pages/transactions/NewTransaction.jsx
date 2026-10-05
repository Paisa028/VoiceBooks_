// Imports the React Router hook used to navigate between pages
import { useNavigate } from "react-router-dom";

// --------------------------------------------------
// NEW TRANSACTION
// --------------------------------------------------

function NewTransaction() {
  // Allows navigation between VoiceBooks screens
  const navigate = useNavigate();

  // --------------------------------------------------
  // VOICE TRANSACTION
  // --------------------------------------------------

  const startVoiceTransaction = () => {
    navigate("/transactions/voice");
  };

  // --------------------------------------------------
  // MANUAL TRANSACTION
  // --------------------------------------------------

  const startManualTransaction = () => {
    navigate("/transactions/manual");
  };

  // --------------------------------------------------
  // TRANSACTION HISTORY
  // --------------------------------------------------

  const openTransactionHistory = () => {
    navigate("/transactions");
  };

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
            aria-label="Go back"
          >
            ←
          </button>

          <h1>New Transaction</h1>

        </header>

        <p className="transaction-intro">
          Choose how you would like to record your transaction.
        </p>

        {/* Voice transaction option */}
        <button
          type="button"
          className="transaction-option"
          onClick={startVoiceTransaction}
        >

          <span className="option-icon">
            🎙️
          </span>

          <span>
            <strong>
              Record with Voice
            </strong>

            <small>
              Speak naturally and let VoiceBooks capture the details.
            </small>
          </span>

          <span>›</span>

        </button>

        {/* Manual transaction option */}
        <button
          type="button"
          className="transaction-option"
          onClick={startManualTransaction}
        >

          <span className="option-icon">
            ⌨️
          </span>

          <span>
            <strong>
              Enter Manually
            </strong>

            <small>
              Type the transaction details yourself.
            </small>
          </span>

          <span>›</span>

        </button>

        {/* Transaction history option */}
        <button
          type="button"
          className="transaction-option"
          onClick={openTransactionHistory}
        >

          <span className="option-icon">
            📋
          </span>

          <span>
            <strong>
              Transaction History
            </strong>

            <small>
              View previously posted VoiceBooks transactions.
            </small>
          </span>

          <span>›</span>

        </button>

      </section>

    </main>
  );
}

// Exports the component so App.jsx can use it
export default NewTransaction;