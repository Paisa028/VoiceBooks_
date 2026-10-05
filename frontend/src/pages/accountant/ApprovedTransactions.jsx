import { useEffect, useState } from "react";
import { accountantApi } from "../../services/accountantApi";

export default function ApprovedTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadApproved() {
            try {
                setLoading(true);
                setError("");

                const result = await accountantApi.approved();

                setTransactions(result.data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadApproved();
    }, []);

    if (loading) {
        return (
            <div className="loading" role="status">
                Loading approved transactions...
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
    <main className="accountant-approved-page">

        <header className="accountant-approved-header">
            <div>
                <p className="accountant-approved-eyebrow">
                    ACCOUNTING RECORDS
                </p>

                <h1>Approved Transactions</h1>

                <p className="accountant-approved-subtitle">
                    Transactions approved by the accounting professional.
                </p>
            </div>
        </header>

        <section className="accountant-approved-card">

            <div className="accountant-approved-card-header">
                <div>
                    <h2>Approved Entries</h2>
                    <p>
                        Review transactions that have successfully
                        completed the approval process.
                    </p>
                </div>

                <div className="accountant-approved-count">
                    {transactions.length}{" "}
                    {transactions.length === 1
                        ? "transaction"
                        : "transactions"}
                </div>
            </div>

            {transactions.length === 0 ? (
                <div className="accountant-approved-empty">

                    <div className="accountant-approved-empty-icon">
                        ✓
                    </div>

                    <h3>No approved transactions yet</h3>

                    <p>
                        Transactions you approve will appear here
                        for future reference.
                    </p>

                </div>
            ) : (
                <div className="accountant-approved-list">

                    {transactions.map((transaction) => (

                        <div
                            className="accountant-approved-row"
                            key={transaction.id}
                        >

                            <div className="accountant-approved-details">
                                <strong>
                                    {transaction.description}
                                </strong>

                                <small>
                                    {transaction.client_name ||
                                        "Client"}
                                </small>
                            </div>

                            <strong className="accountant-approved-amount">
                                {new Intl.NumberFormat("en-ZA", {
                                    style: "currency",
                                    currency: "ZAR",
                                }).format(
                                    Number(transaction.amount || 0)
                                )}
                            </strong>

                            <span className="accountant-approved-status">
                                ✓ Approved
                            </span>

                        </div>

                    ))}

                </div>
            )}

        </section>

    </main>
);
}