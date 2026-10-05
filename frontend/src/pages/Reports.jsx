import { useEffect, useMemo, useState } from "react";

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/transactions?status=approved"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Report data could not be loaded."
          );
        }

        setTransactions(data.transactions || []);
      } catch (err) {
        console.error("Reports error:", err);

        setError(
          err.message ||
            "VoiceBooks could not load the report data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const money = (value) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(Number(value) || 0);

  const getDate = (transaction) => {
    const value =
      transaction.transactionDate ||
      transaction.date ||
      transaction.createdAt;

    if (!value) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  };

  const filteredTransactions = useMemo(() => {
    if (period === "all") {
      return transactions;
    }

    const now = new Date();

    return transactions.filter((transaction) => {
      const date = getDate(transaction);

      if (!date) return false;

      if (period === "month") {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }

      if (period === "year") {
        return date.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [transactions, period]);

  const report = useMemo(() => {
    let income = 0;
    let expenses = 0;

    const categories = {};

    filteredTransactions.forEach((transaction) => {
      const amount = Number(transaction.amount) || 0;

      const type = String(
        transaction.transactionType ||
        transaction.type ||
        ""
      ).toLowerCase();

      const category =
        transaction.accountCategory ||
        transaction.category ||
        "Uncategorised";

      if (
        type.includes("income") ||
        type.includes("receipt") ||
        type.includes("sale")
      ) {
        income += amount;
      } else {
        expenses += amount;

        categories[category] =
          (categories[category] || 0) + amount;
      }
    });

    return {
      income,
      expenses,
      netProfit: income - expenses,
      categories,
    };
  }, [filteredTransactions]);

  const categoryRows = Object.entries(report.categories)
    .sort((a, b) => b[1] - a[1]);

  const totalActivity =
    report.income + report.expenses;

  const incomePercent =
    totalActivity > 0
      ? (report.income / totalActivity) * 100
      : 0;

  const expensePercent =
    totalActivity > 0
      ? (report.expenses / totalActivity) * 100
      : 0;

  return (
    <main className="reports-page">
      <section className="reports-container">

        <header className="reports-header">
          <div>
            <p className="reports-eyebrow">
              BUSINESS REPORTING
            </p>

            <h1>Reports</h1>

            <p>
              Review your business performance using your
              posted VoiceBooks transactions.
            </p>
          </div>

          <select aria-label="Report period"
            className="reports-period"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value)
            }
          >
            <option value="all">
              All transactions
            </option>

            <option value="month">
              This month
            </option>

            <option value="year">
              This year
            </option>
          </select>
        </header>

        {loading && (
          <section className="reports-state">
            <h3>Loading reports...</h3>
            <p>
              VoiceBooks is analysing your transactions.
            </p>
          </section>
        )}

        {!loading && error && (
          <section className="reports-state reports-error">
            <h3>Reports unavailable</h3>
            <p>{error}</p>
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="reports-summary">

              <article className="reports-summary-card">
                <span>Total Income</span>
                <strong>
                  {money(report.income)}
                </strong>
                <small>
                  Income from posted transactions
                </small>
              </article>

              <article className="reports-summary-card">
                <span>Total Expenses</span>
                <strong>
                  {money(report.expenses)}
                </strong>
                <small>
                  Expenses from posted transactions
                </small>
              </article>

              <article className="reports-summary-card">
                <span>Net Profit</span>

                <strong
                  className={
                    report.netProfit < 0
                      ? "negative"
                      : "positive"
                  }
                >
                  {money(report.netProfit)}
                </strong>

                <small>
                  Income less expenses
                </small>
              </article>

              <article className="reports-summary-card">
                <span>Transactions</span>
                <strong>
                  {filteredTransactions.length}
                </strong>
                <small>
                  Posted transactions
                </small>
              </article>

            </section>

            <section className="reports-grid">

              <article className="reports-panel">
                <div className="reports-panel-heading">
                  <div>
                    <h2>Income vs Expenses</h2>
                    <p>
                      Overview of your financial activity
                    </p>
                  </div>
                </div>

                {totalActivity === 0 ? (
                  <div className="reports-empty">
                    <h3>No financial activity yet</h3>
                    <p>
                      Income and expense information will
                      appear after transactions are posted.
                    </p>
                  </div>
                ) : (
                  <div className="reports-comparison">

                    <div className="reports-bar-row">
                      <div className="reports-bar-label">
                        <span>Income</span>
                        <strong>
                          {money(report.income)}
                        </strong>
                      </div>

                      <div className="reports-bar-track">
                        <div
                          className="reports-bar reports-income-bar"
                          style={{
                            width: `${incomePercent}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="reports-bar-row">
                      <div className="reports-bar-label">
                        <span>Expenses</span>
                        <strong>
                          {money(report.expenses)}
                        </strong>
                      </div>

                      <div className="reports-bar-track">
                        <div
                          className="reports-bar reports-expense-bar"
                          style={{
                            width: `${expensePercent}%`,
                          }}
                        />
                      </div>
                    </div>

                  </div>
                )}
              </article>

              <article className="reports-panel">
                <div className="reports-panel-heading">
                  <div>
                    <h2>Expense Breakdown</h2>
                    <p>
                      Spending by account category
                    </p>
                  </div>
                </div>

                {categoryRows.length === 0 ? (
                  <div className="reports-empty">
                    <h3>No expense categories yet</h3>
                    <p>
                      Categories will appear when expense
                      transactions are posted.
                    </p>
                  </div>
                ) : (
                  <div className="reports-category-list">
                    {categoryRows.map(
                      ([category, amount]) => (
                        <div
                          className="reports-category-row"
                          key={category}
                        >
                          <div>
                            <strong>
                              {category}
                            </strong>

                            <span>
                              Expense category
                            </span>
                          </div>

                          <strong>
                            {money(amount)}
                          </strong>
                        </div>
                      )
                    )}
                  </div>
                )}
              </article>

            </section>
          </>
        )}

      </section>
    </main>
  );
}