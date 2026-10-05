import { useEffect, useMemo, useState } from "react";

export default function Ledger() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");

  useEffect(() => {
    async function loadLedger() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:3715/api/transactions"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "The ledger could not be loaded."
          );
        }

        setTransactions(data.transactions || []);
      } catch (err) {
        console.error("Ledger error:", err);

        setError(
          err.message ||
            "VoiceBooks could not load the general ledger."
        );
      } finally {
        setLoading(false);
      }
    }

    loadLedger();
  }, []);

  const entries = useMemo(() => {
    return transactions.flatMap((transaction) => {
      const journalEntries = Array.isArray(transaction.journalEntries)
        ? transaction.journalEntries
        : [];

      return journalEntries.map((entry, index) => ({
        id: `${transaction.id || "transaction"}-${index}`,
        transactionId: transaction.id,
        date:
          transaction.transactionDate ||
          transaction.date ||
          transaction.createdAt,
        account: entry.account || "Uncategorised",
        description:
          transaction.description ||
          transaction.party ||
          transaction.customerSupplier ||
          "Transaction",
        reference:
          transaction.reference ||
          transaction.referenceNumber ||
          transaction.invoiceNumber ||
          "-",
        debit: Number(entry.debit) || 0,
        credit: Number(entry.credit) || 0,
      }));
    });
  }, [transactions]);

  const accounts = useMemo(() => {
    return [
      ...new Set(
        entries
          .map((entry) => entry.account)
          .filter(Boolean)
      ),
    ].sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesAccount =
        accountFilter === "all" ||
        entry.account === accountFilter;

      const matchesSearch =
        !term ||
        entry.account.toLowerCase().includes(term) ||
        entry.description.toLowerCase().includes(term) ||
        String(entry.reference).toLowerCase().includes(term);

      return matchesAccount && matchesSearch;
    });
  }, [entries, search, accountFilter]);

  const totalDebits = filteredEntries.reduce(
    (total, entry) => total + entry.debit,
    0
  );

  const totalCredits = filteredEntries.reduce(
    (total, entry) => total + entry.credit,
    0
  );

  const balance = totalDebits - totalCredits;

  const money = (value) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(Number(value) || 0);

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  return (
    <main className="ledger-page">
      <section className="ledger-page-container">

        <header className="ledger-page-header">
          <div>
            <p className="ledger-eyebrow">ACCOUNTING</p>
            <h1>General Ledger</h1>
            <p>
              Review the debit and credit entries created from
              your posted VoiceBooks transactions.
            </p>
          </div>
        </header>

        <section className="ledger-summary">
          <article className="ledger-summary-card">
            <span>Total Debits</span>
            <strong>{money(totalDebits)}</strong>
            <small>For the current selection</small>
          </article>

          <article className="ledger-summary-card">
            <span>Total Credits</span>
            <strong>{money(totalCredits)}</strong>
            <small>For the current selection</small>
          </article>

          <article className="ledger-summary-card">
            <span>Balance</span>
            <strong>{money(balance)}</strong>
            <small>Debits less credits</small>
          </article>
        </section>

        <section className="ledger-content">

          <div className="ledger-toolbar">
            <div>
              <h2>Ledger Entries</h2>
              <p>
                {filteredEntries.length} journal{" "}
                {filteredEntries.length === 1 ? "entry" : "entries"}
              </p>
            </div>

            <div className="ledger-filters">
              <input
                type="search"
                placeholder="Search ledger..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <select
                value={accountFilter}
                onChange={(event) =>
                  setAccountFilter(event.target.value)
                }
              >
                <option value="all">All Accounts</option>

                {accounts.map((account) => (
                  <option key={account} value={account}>
                    {account}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && (
            <div className="ledger-state">
              <h3>Loading ledger...</h3>
              <p>
                VoiceBooks is retrieving your journal entries.
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="ledger-state ledger-error">
              <h3>Ledger unavailable</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredEntries.length === 0 && (
              <div className="ledger-state">
                <div className="ledger-empty-icon">▤</div>

                <h3>No ledger entries yet</h3>

                <p>
                  Once you post a transaction, its debit and
                  credit entries will appear here automatically.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            filteredEntries.length > 0 && (
              <div className="ledger-table-wrap">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Account</th>
                      <th>Description</th>
                      <th>Reference</th>
                      <th className="number-column">Debit</th>
                      <th className="number-column">Credit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.date)}</td>

                        <td>
                          <strong>{entry.account}</strong>
                        </td>

                        <td>{entry.description}</td>

                        <td>{entry.reference}</td>

                        <td className="number-column">
                          {entry.debit
                            ? money(entry.debit)
                            : "—"}
                        </td>

                        <td className="number-column">
                          {entry.credit
                            ? money(entry.credit)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>

      </section>
    </main>
  );
}