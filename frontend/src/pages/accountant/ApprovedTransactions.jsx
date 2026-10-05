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
            <div className="loading">
                Loading approved transactions...
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
                <p className="eyebrow">
                    ACCOUNTING RECORDS
                </p>

                <h1>
                    Approved Transactions
                </h1>

                <p>
                    Transactions approved by the
                    accounting professional.
                </p>
            </header>

            <section className="content-card">

                {transactions.length === 0 ? (
                    <div className="empty-state">
                        No approved transactions yet.
                    </div>
                ) : (
                    transactions.map((transaction) => (
                        <div
                            className="transaction-row"
                            key={transaction.id}
                        >
                            <div>
                                <strong>
                                    {transaction.description}
                                </strong>

                                <small>
                                    {transaction.client_name}
                                </small>
                            </div>

                            <strong>
                                R
                                {Number(
                                    transaction.amount || 0
                                ).toFixed(2)}
                            </strong>

                            <span className="status approved">
                                Approved
                            </span>
                        </div>
                    ))
                )}

            </section>

        </main>
    );
}