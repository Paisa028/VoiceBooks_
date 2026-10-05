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
                setTransactions(transactionResult.data || []);
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
            <div className="loading" role="status">
                Loading client...
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

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-ZA", {
            style: "currency",
            currency: "ZAR",
        }).format(Number(amount || 0));

    const formatStatus = (status) =>
        status
            ?.replaceAll("_", " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());

    return (
        <main className="accountant-client-details-page">

            {/* CLIENT HEADER */}
            <header className="accountant-client-details-header">

                <div>
                    <p className="accountant-client-details-eyebrow">
                        CLIENT DETAILS
                    </p>

                    <h1>{client?.name}</h1>

                    <p className="accountant-client-business">
                        {client?.business_name}
                    </p>

                    <p className="accountant-client-email">
                        {client?.email}
                    </p>
                </div>

                <button
                    type="button"
                    className="accountant-client-back-button"
                    onClick={() =>
                        navigate("/accountant/clients")
                    }
                >
                    ← Back to Clients
                </button>

            </header>


            {/* TRANSACTIONS */}
            <section className="accountant-client-transactions-card">

                <div className="accountant-client-section-heading">

                    <div>
                        <h2>Transactions</h2>

                        <p>
                            Accounting transactions for this client.
                        </p>
                    </div>

                    <span className="accountant-client-transaction-count">
                        {transactions.length}{" "}
                        {transactions.length === 1
                            ? "transaction"
                            : "transactions"}
                    </span>

                </div>


                {transactions.length === 0 ? (

                    <div className="accountant-client-empty-state">

                        <div className="accountant-client-empty-icon">
                            ≡
                        </div>

                        <h3>No transactions found</h3>

                        <p>
                            This client does not have any
                            accounting transactions yet.
                        </p>

                    </div>

                ) : (

                    <div className="accountant-client-transaction-list">

                        {transactions.map((transaction) => (

                            <div
                                className="accountant-client-transaction-row"
                                key={transaction.id}
                            >

                                {/* LEFT */}
                                <div className="accountant-client-transaction-info">

                                    <strong>
                                        {transaction.description}
                                    </strong>

                                    <small>
                                        {transaction.supplier ||
                                            "No supplier"}
                                    </small>

                                </div>


                                {/* RIGHT */}
                                <div className="accountant-client-transaction-right">

                                    <strong className="accountant-client-amount">
                                        {formatCurrency(
                                            transaction.amount
                                        )}
                                    </strong>

                                    <span
                                        className={`accountant-client-status ${transaction.status}`}
                                    >
                                        {formatStatus(
                                            transaction.status
                                        )}
                                    </span>

                                    {transaction.status ===
                                        "pending_review" && (

                                        <button
                                            type="button"
                                            className="accountant-client-review-button"
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

                            </div>

                        ))}

                    </div>

                )}

            </section>

        </main>
    );
}