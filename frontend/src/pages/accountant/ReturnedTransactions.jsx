import { useEffect, useState } from "react";
import { accountantApi } from "../../services/accountantApi";

export default function ReturnedTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadReturned() {
            try {
                setLoading(true);
                setError("");

                const result = await accountantApi.returned();

                setTransactions(result.data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadReturned();
    }, []);

    if (loading) {
        return (
            <div className="loading" role="status">
                Loading returned transactions...
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
        <main className="accountant-returned-page">

            <header className="accountant-returned-header">
                <div>
                    <p className="accountant-returned-eyebrow">
                        TRANSACTION RETURNS
                    </p>

                    <h1>Returned Transactions</h1>

                    <p className="accountant-returned-subtitle">
                        Transactions returned to clients for correction.
                    </p>
                </div>
            </header>

            <section className="accountant-returned-card">

                <div className="accountant-returned-card-header">
                    <div>
                        <h2>Returned Entries</h2>
                        <p>
                            Review transactions that require corrections
                            before they can be approved.
                        </p>
                    </div>

                    <div className="accountant-returned-count">
                        {transactions.length}{" "}
                        {transactions.length === 1
                            ? "transaction"
                            : "transactions"}
                    </div>
                </div>

                {transactions.length === 0 ? (
                    <div className="accountant-returned-empty">

                        <div className="accountant-returned-empty-icon">
                            ↩
                        </div>

                        <h3>No returned transactions</h3>

                        <p>
                            Transactions returned for correction will
                            appear here.
                        </p>

                    </div>
                ) : (
                    <div className="accountant-returned-list">

                        {transactions.map((transaction) => (
                            <div
                                className="accountant-returned-row"
                                key={transaction.id}
                            >
                                <div className="accountant-returned-details">
                                    <strong>
                                        {transaction.description}
                                    </strong>

                                    <small>
                                        {transaction.client_name || "Client"}
                                    </small>
                                </div>

                                <div className="accountant-returned-reason">
                                    <span>Reason</span>

                                    <p>
                                        {transaction.rejection_reason ||
                                            "Correction required"}
                                    </p>
                                </div>

                                <span className="accountant-returned-status">
                                    ↩ Returned
                                </span>
                            </div>
                        ))}

                    </div>
                )}

            </section>

        </main>
    );
}