
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { accountantApi } from "../../services/accountantApi";

const currencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

function formatCurrency(value) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? currencyFormatter.format(amount)
    : "Not available";
}

function formatStatus(status) {
  const labels = {
    pending_review: "Pending Review",
    approved: "Approved",
    returned: "Returned",
  };

  return labels[status] || "Unknown";
}

function getTransactionDetails(transaction) {
  const category = String(
    transaction.accountCategory ||
      transaction.category ||
      ""
  ).trim();

  const description = String(
    transaction.description || ""
  ).trim();

  const isNumericDescription =
    description !== "" &&
    /^\d+(?:[.,]\d+)?$/.test(description);

  const title =
    category ||
    (!isNumericDescription ? description : "") ||
    "Uncategorised Transaction";

  const subtitle =
    description &&
    !isNumericDescription &&
    description.toLowerCase() !== title.toLowerCase()
      ? description
      : null;

  const supplier = String(
    transaction.party ||
      transaction.supplier ||
      ""
  ).trim();

  return { title, subtitle, supplier };
}

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadClient() {
      try {
        setLoading(true);
        setError("");

        const [clientResult, transactionResult] =
          await Promise.all([
            accountantApi.client(id),
            accountantApi.clientTransactions(id),
          ]);

        if (active) {
          setClient(clientResult.data ?? null);

          setTransactions(
            Array.isArray(transactionResult.data)
              ? transactionResult.data
              : []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load client details."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadClient();
    } else {
      setError("Client ID is missing.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="loading" role="status">
        Loading client...
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="error-box" role="alert">
        {error || "Client not found."}
      </div>
    );
  }

  return (
    <main className="accountant-client-details-page">
      <header className="accountant-client-details-header">
        <div>
          <p className="accountant-client-details-eyebrow">
            CLIENT DETAILS
          </p>

          <h1>{client.name || "Client"}</h1>

          <p className="accountant-client-business">
            {client.business_name || "Business not provided"}
          </p>

          <p className="accountant-client-email">
            {client.email || "Email not provided"}
          </p>
        </div>

        <button
          type="button"
          className="accountant-client-back-button"
          onClick={() => navigate("/accountant/clients")}
        >
          ← Back to Clients
        </button>
      </header>

      <section className="accountant-client-transactions-card">
        <div className="accountant-client-section-heading">
          <div>
            <h2>Transactions</h2>

            <p>
              Accounting transactions for this client.
            </p>
          </div>

          <span className="accountant-client-transaction-count">
            {transactions.length}{" "}
            {transactions.length === 1
              ? "transaction"
              : "transactions"}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="accountant-client-empty-state">
            <div className="accountant-client-empty-icon">
              ≡
            </div>

            <h3>No transactions found</h3>

            <p>
              This client does not have any accounting
              transactions yet.
            </p>
          </div>
        ) : (
          <div className="accountant-client-transaction-list">
            {transactions.map((transaction) => {
              const { title, subtitle, supplier } =
                getTransactionDetails(transaction);

              const isPending =
                transaction.status === "pending_review";

              return (
                <div
                  className="accountant-client-transaction-row"
                  key={transaction.id}
                >
                  <div className="accountant-client-transaction-info">
                    <strong>{title}</strong>

                    {subtitle && (
                      <small>{subtitle}</small>
                    )}

                    {supplier && (
                      <small>{supplier}</small>
                    )}
                  </div>

                  <div className="accountant-client-transaction-right">
                    <strong className="accountant-client-amount">
                      {formatCurrency(transaction.amount)}
                    </strong>

                    <span
                      className={`accountant-client-status ${
                        transaction.status || ""
                      }`}
                    >
                      {formatStatus(transaction.status)}
                    </span>

                    <button
                      type="button"
                      className="accountant-client-review-button"
                      onClick={() =>
                        navigate(
                          `/accountant/review/${transaction.id}`
                        )
                      }
                    >
                      {isPending ? "Review" : "View"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
