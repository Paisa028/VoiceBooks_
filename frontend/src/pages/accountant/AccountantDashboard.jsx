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
            <div className="loading">
                Loading accountant dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-box">
                {error}
            </div>
        );
    }

    return (
        <main className="accountant-page">

            <header className="page-header">
                <div>
                    <p className="eyebrow">
                        ACCOUNTANT WORKSPACE
                    </p>

                    <h1>
                        Accountant Dashboard
                    </h1>

                    <p>
                        Review client transactions
                        and approve accounting entries.
                    </p>
                </div>
            </header>


            <section className="stats-grid">

                <div
                    className="stat-card"
                    onClick={() =>
                        navigate("/accountant/clients")
                    }
                >
                    <span>Clients</span>

                    <strong>
                        {data.clients}
                    </strong>
                </div>

                <div className="stat-card warning">
                    <span>Pending Reviews</span>

                    <strong>
                        {data.pendingReviews}
                    </strong>
                </div>

                <div
                    className="stat-card"
                    onClick={() =>
                        navigate("/accountant/approved")
                    }
                >
                    <span>Approved</span>

                    <strong>
                        {data.approvedTransactions}
                    </strong>
                </div>

            </section>


            <section className="content-card">

                <div className="section-heading">
                    <div>
                        <h2>
                            Recent Transactions
                        </h2>

                        <p>
                            Latest transaction activity
                        </p>
                    </div>
                </div>


                <div className="transaction-list">

                    {data.recentTransactions.map(
                        transaction => (

                            <div
                                className="transaction-row"
                                key={transaction.id}
                            >

                                <div>
                                    <strong>
                                        {transaction.description}
                                    </strong>

                                    <small>
                                        {transaction.supplier}
                                    </small>
                                </div>

                                <strong>
                                    R
                                    {Number(
                                        transaction.amount
                                    ).toFixed(2)}
                                </strong>

                                <span
                                    className={`status ${transaction.status}`}
                                >
                                    {transaction.status}
                                </span>

                                {transaction.status ===
                                    "pending_review" && (

                                    <button
                                        className="btn-primary"
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

                        )
                    )}

                </div>

            </section>

        </main>
    );
}