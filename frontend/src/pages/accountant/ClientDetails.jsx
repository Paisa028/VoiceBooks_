import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { accountantApi } from "../../services/accountantApi";

export default function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [client, setClient] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadClient() {
            try {
                setLoading(true);
                setError("");

                const [clientResult, transactionResult] =
                    await Promise.all([
                        accountantApi.client(id),
                        accountantApi.clientTransactions(id)
                    ]);

                setClient(clientResult.data);
                setTransactions(transactionResult.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadClient();
    }, [id]);

    if (loading) {
        return (
            <div className="loading">
                Loading client...
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
                        CLIENT DETAILS
                    </p>

                    <h1>{client?.name}</h1>

                    <p>
                        {client?.business_name}
                    </p>

                    <small>
                        {client?.email}
                    </small>
                </div>

                <button
                    className="btn-primary"
                    onClick={() =>
                        navigate("/accountant/clients")
                    }
                >
                    Back to Clients
                </button>
            </header>

            <section className="content-card">

                <div className="section-heading">
                    <div>
                        <h2>Transactions</h2>

                        <p>
                            Accounting transactions for this client.
                        </p>
                    </div>
                </div>

                {transactions.length === 0 ? (
                    <p>
                        No transactions found for this client.
                    </p>
                ) : (
                    <div className="transaction-list">

                        {transactions.map(transaction => (
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
                        ))}

                    </div>
                )}

            </section>

        </main>
    );
}