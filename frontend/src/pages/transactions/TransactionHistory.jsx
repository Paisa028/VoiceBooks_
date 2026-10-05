import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

// --------------------------------------------------
// TRANSACTION HISTORY
// --------------------------------------------------

function TransactionHistory() {
  const navigate = useNavigate();

  const [transactions, setTransactions] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // --------------------------------------------------
  // LOAD TRANSACTIONS
  // --------------------------------------------------

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          "http://localhost:3715/api/transactions"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Transactions could not be loaded."
          );
        }

        setTransactions(
          data.transactions || []
        );
      } catch (error) {
        console.error(
          "Transaction history error:",
          error
        );

        setErrorMessage(
          error.message ||
            "VoiceBooks could not load the transaction history."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // --------------------------------------------------
  // FILTER TRANSACTIONS
  // --------------------------------------------------

  const filteredTransactions =
    useMemo(() => {
      const normalisedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {
          const matchesFilter =
            filter === "all" ||
            transaction.type === filter;

          const searchableText = [
            transaction.id,
            transaction.party,
            transaction.description,
            transaction.accountCategory,
            transaction.reference,
            transaction.paymentMethod,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !normalisedSearch ||
            searchableText.includes(
              normalisedSearch
            );

          return (
            matchesFilter &&
            matchesSearch
          );
        }
      );
    }, [
      transactions,
      searchTerm,
      filter,
    ]);
   //--------------------------------------------------
   // GROUP TRANSACTIONS BY DATE
 //--------------------------------------------------

const groupedTransactions = useMemo(() => {
  const groups = {};

  filteredTransactions.forEach((transaction) => {
    const dateValue = transaction.transactionDate;

    if (!dateValue) {
      const label = "Date unavailable";

      if (!groups[label]) {
        groups[label] = [];
      }

      groups[label].push(transaction);
      return;
    }

    const transactionDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(transactionDate.getTime())) {
      
      const label = "Date unavailable";
      if (!groups[label]) {
         groups[label] = [];
        }

  groups[label].push(transaction);
  return;
}

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

  const formattedDate = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "long",
  year: "numeric",
}).format(transactionDate);

let label;

if (transactionDate.getTime() === today.getTime()) {
  label = `Today — ${formattedDate}`;
} else if (
  transactionDate.getTime() === yesterday.getTime()
) {
  label = `Yesterday — ${formattedDate}`;
} else {
  label = formattedDate;
}

    if (!groups[label]) {
      groups[label] = [];
    }

    groups[label].push(transaction);
  });

  return groups;
}, [filteredTransactions]);

  // --------------------------------------------------
  // FORMAT AMOUNT
  // --------------------------------------------------

  const formatAmount = (
    amount,
    type
  ) => {
    const numericAmount =
      Number(amount) || 0;

    const formattedAmount =
      new Intl.NumberFormat(
        "en-ZA",
        {
          style: "currency",
          currency: "ZAR",
        }
      ).format(numericAmount);

    if (type === "income") {
      return `+${formattedAmount}`;
    }

    if (type === "expense") {
      return `-${formattedAmount}`;
    }

    return formattedAmount;
  };
  // --------------------------------------------------
  // OPEN DETAILS
  // --------------------------------------------------

  const openTransaction = (
    transactionId
  ) => {
    navigate(
      `/transactions/${transactionId}`
    );
  };

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="transaction-page">
      <section className="transaction-container transaction-history-container">

        {/* Header */}
        <header className="transaction-header">
          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate("/")
            }
            aria-label="Go back"
          >
            ←
          </button>

          <div>
            <h1>
              Transaction History
            </h1>

            <p className="transaction-intro">
              Review transactions posted
              through VoiceBooks.
            </p>
          </div>
        </header>

        {/* Controls */}
        <section className="history-controls">

          <div className="history-search">
            <span
              className="history-search-icon"
              aria-hidden="true"
            >
              🔎
            </span>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search transactions"
              aria-label="Search transactions"
            />
          </div>

          <div className="history-filters">

            <button
              type="button"
              className={
                filter === "all"
                  ? "history-filter active"
                  : "history-filter"
              }
              onClick={() =>
                setFilter("all")
              }
            >
              All
            </button>

            <button
              type="button"
              className={
                filter === "income"
                  ? "history-filter active"
                  : "history-filter"
              }
              onClick={() =>
                setFilter("income")
              }
            >
              Income
            </button>

            <button
              type="button"
              className={
                filter === "expense"
                  ? "history-filter active"
                  : "history-filter"
              }
              onClick={() =>
                setFilter("expense")
              }
            >
              Expense
            </button>

          </div>
        </section>

        {/* Loading */}
        {isLoading && (
          <div className="history-message">
            <h2>
              Loading transactions...
            </h2>

            <p>
              VoiceBooks is retrieving
              your transaction history.
            </p>
          </div>
        )}

        {/* Error */}
        {!isLoading &&
          errorMessage && (
            <div className="recording-error">
              {errorMessage}
            </div>
          )}

        {/* Empty */}
        {!isLoading &&
          !errorMessage &&
          filteredTransactions.length ===
            0 && (
            <div className="history-message">
              <h2>
                No transactions found
              </h2>

              <p>
                Posted transactions will
                appear here.
              </p>

              <button
                type="button"
                className="success-primary-button"
                onClick={() =>
                  navigate("/")
                }
              >
                New Transaction
              </button>
            </div>
          )}

        {/* Transactions */}
{!isLoading &&
  !errorMessage &&
  filteredTransactions.length > 0 && (
    <section className="history-list">
      {Object.entries(groupedTransactions).map(
        ([dateLabel, dateTransactions]) => (
          <div
            className="history-date-group"
            key={dateLabel}
          >
            <h2 className="history-date-heading">
              {dateLabel}
            </h2>

            <div className="history-date-transactions">
              {dateTransactions.map((transaction) => (
                <button
                  type="button"
                  className="history-item"
                  key={transaction.id}
                  onClick={() =>
                    openTransaction(transaction.id)
                  }
                >
                  <div
                    className={`history-item-icon ${
                      transaction.type === "income"
                        ? "income"
                        : "expense"
                    }`}
                  >
                    {transaction.type === "income"
                      ? "↙"
                      : "↗"}
                  </div>

                  <div className="history-item-main">
                    <strong>
                      {transaction.party ||
                        transaction.description ||
                        "Transaction"}
                    </strong>

                    <span>
                      {transaction.accountCategory ||
                        transaction.description ||
                        "Uncategorised"}
                    </span>

                    <small>
                      {transaction.paymentMethod ||
                        "Payment method unavailable"}
                    </small>
                  </div>

                  <div className="history-item-side">
                    <strong
                      className={
                        transaction.type === "income"
                          ? "history-income"
                          : "history-expense"
                      }
                    >
                      {formatAmount(
                        transaction.amount,
                        transaction.type
                      )}
                    </strong>

                    <span className="success-status">
                      {transaction.status || "confirmed"}
                    </span>
                  </div>

                  <span
                    className="history-item-chevron"
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      )}
    </section>
  )}
  {/* Footer */}
  {!isLoading &&
  !errorMessage &&
          transactions.length > 0 && (
            <footer className="history-footer">

              <span>
                {
                  filteredTransactions.length
                }{" "}
                transaction
                {filteredTransactions.length ===
                1
                  ? ""
                  : "s"}
              </span>

              <button
                type="button"
                className="success-primary-button"
                onClick={() =>
                  navigate("/")
                }
              >
                New Transaction
              </button>

            </footer>
          )}

      </section>
    </main>
  );
}

export default TransactionHistory;