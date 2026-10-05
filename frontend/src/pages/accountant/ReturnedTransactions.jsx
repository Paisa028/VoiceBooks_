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
            <div className="loading">
                Loading returned transactions...
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
                    TRANSACTION RETURNS
                </p>

                <h1>
                    Returned Transactions
                </h1>

                <p>
                    Transactions that require correction.
                </p>
            </header>

            <section className="content-card">

                {transactions.length === 0 ? (
                    <div className="empty-state">
                        No returned transactions.
                    </div>
                ) : (
                    transactions.map((transaction) => (
                        <div
                            className="returned-row"
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

                            <div>
                                <span>
                                    Reason:
                                </span>

                                <p>
                                    {transaction.rejection_reason}
                                </p>
                            </div>

                            <span className="status returned">
                                Returned
                            </span>
                        </div>
                    ))
                )}

            </section>

        </main>
    );
}