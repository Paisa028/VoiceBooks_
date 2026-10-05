import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountantApi } from "../../services/accountantApi";

export default function AccountantDashboard() {
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);

                const result =
                    await accountantApi.dashboard();

                setData(result.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="loading" role="status">
                Loading accountant dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-box" role="alert">
                {error}
            </div>
        );
    }

    return (
    <main className="accountant-dashboard-page">

        <header className="accountant-dashboard-header">
            <div>
                <p className="accountant-eyebrow">
                    ACCOUNTANT WORKSPACE
                </p>

                <h1>Accountant Dashboard</h1>

                <p className="accountant-subtitle">
                    Review client transactions and approve accounting entries.
                </p>
            </div>
        </header>

        <section className="accountant-stats-grid">

            <button
                type="button"
                className="accountant-stat-card"
                onClick={() => navigate("/accountant/clients")}
            >
                <span>Clients</span>
                <strong>{data.clients ?? 0}</strong>
                <small>Businesses assigned to you</small>
            </button>

            <div className="accountant-stat-card accountant-warning">
                <span>Pending Reviews</span>
                <strong>{data.pendingReviews ?? 0}</strong>
                <small>Transactions waiting for review</small>
            </div>

            <button
                type="button"
                className="accountant-stat-card"
                onClick={() => navigate("/accountant/approved")}
            >
                <span>Approved</span>
                <strong>{data.approvedTransactions ?? 0}</strong>
                <small>Approved accounting entries</small>
            </button>

        </section>

        <section className="accountant-content-card">

            <div className="accountant-section-heading">
                <div>
                    <h2>Recent Transactions</h2>
                    <p>Latest transaction activity</p>
                </div>
            </div>

            <div className="accountant-transaction-list">

                {!data.recentTransactions?.length ? (
                    <div className="accountant-empty-state">
                        <h3>No transactions to review</h3>
                        <p>
                            Transactions from your clients will appear here
                            when they are submitted for review.
                        </p>
                    </div>
                ) : (
                    data.recentTransactions.map((transaction) => (
                        <div
                            className="accountant-transaction-row"
                            key={transaction.id}
                        >
                            <div className="accountant-transaction-details">
                                <strong>{transaction.description}</strong>
                                <small>
                                    {transaction.supplier || "No supplier"}
                                </small>
                            </div>

                            <strong className="accountant-amount">
                                {new Intl.NumberFormat("en-ZA", {
                                    style: "currency",
                                    currency: "ZAR",
                                }).format(Number(transaction.amount))}
                            </strong>

                            <span
                                className={`accountant-status ${transaction.status}`}
                            >
                                {transaction.status
                                    ?.replaceAll("_", " ")}
                            </span>

                            {transaction.status === "pending_review" && (
                                <button
                                    type="button"
                                    className="accountant-review-button"
                                    onClick={() =>
                                        navigate(
                                            `/accountant/review/${transaction.id}`
                                        )
                                    }
                                >
                                    Review
                                </button>
                            )}
                        </div>
                    ))
                )}

            </div>

        </section>

    </main>
);
}