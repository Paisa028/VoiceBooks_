import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { accountantApi } from "../../services/accountantApi";

export default function TransactionReview() {
    const { id } = useParams();
    const navigate = useNavigate();

    const transactionId = id;

    const [transaction, setTransaction] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [processing, setProcessing] =
        useState(false);

    const [showReject, setShowReject] =
        useState(false);

    const [reason, setReason] =
        useState("");

    const [error, setError] =
        useState("");

    useEffect(() => {
        let active = true;
        async function loadTransaction() {
            setLoading(true);
            setError('');
            try {
                const result = await accountantApi.transactionReview(transactionId);
                if (active) setTransaction(result.data);
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        }
        loadTransaction();
        return () => { active = false; };
    }, [transactionId]);


    async function approve() {
        try {
            setProcessing(true);
            setError("");

            await accountantApi.approve(
                transactionId
            );

           navigate("/accountant/approved");

        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    }


    async function reject() {
        try {
            if (reason.trim().length < 5) {
                setError(
                    "Please provide a clear reason."
                );

                return;
            }

            setProcessing(true);
            setError("");

            await accountantApi.reject(
                transactionId,
                reason
            );

            navigate("/accountant/returned");

        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    }


    if (loading) {
        return (
            <div className="loading" role="status">
                Loading transaction...
            </div>
        );
    }


    if (!transaction) {
        return (
            <div className="error-box" role="alert">
                {error || "Transaction not found"}
            </div>
        );
    }


    return (
        <main className="accountant-page">

            <header className="page-header">

                <p className="eyebrow">
                    TRANSACTION REVIEW
                </p>

                <h1>
                    Review Transaction
                </h1>

                <p>
                    Verify the transaction before
                    approving or returning it.
                </p>

            </header>


            {error && (
                <div
                    className="error-box" role="alert"
                    role="alert"
                >
                    {error}
                </div>
            )}


            <section className="review-grid">


                <div className="content-card">

                    <h2>
                        Original Transcription
                    </h2>

                    <div className="transcription-box">
                        {transaction
                            .original_transcription}
                    </div>

                </div>


                <div className="content-card">

                    <h2>
                        Client
                    </h2>

                    <div className="detail-list">

                        <div>
                            <span>Name</span>
                            <strong>
                                {transaction.client_name}
                            </strong>
                        </div>

                        <div>
                            <span>Business</span>
                            <strong>
                                {transaction.business_name}
                            </strong>
                        </div>

                        <div>
                            <span>Email</span>
                            <strong>
                                {transaction.client_email}
                            </strong>
                        </div>

                    </div>

                </div>


            </section>


            <section className="content-card">

                <div className="section-heading">

                    <div>
                        <h2>
                            Extracted Transaction
                        </h2>

                        <p>
                            Information extracted from
                            the client's transaction.
                        </p>
                    </div>

                    <span className={`status ${transaction.status}`}>
                        {transaction.status.replaceAll('_', ' ')}
                    </span>

                </div>


                <div className="details-grid">

                    <div>
                        <label>
                            Description
                        </label>

                        <strong>
                            {transaction.description}
                        </strong>
                    </div>

                    <div>
                        <label>
                            Supplier
                        </label>

                        <strong>
                            {transaction.supplier}
                        </strong>
                    </div>

                    <div>
                        <label>
                            Amount
                        </label>

                        <strong>
                            R
                            {Number(
                                transaction.amount
                            ).toFixed(2)}
                        </strong>
                    </div>

                    <div>
                        <label>
                            Category
                        </label>

                        <strong>
                            {transaction.category}
                        </strong>
                    </div>

                </div>

            </section>


            <section className="content-card">

                <h2>
                    Accounting Entry
                </h2>

                <table className="accounting-table">

                    <thead>
                        <tr>
                            <th>Account</th>
                            <th>Debit</th>
                            <th>Credit</th>
                        </tr>
                    </thead>

                    <tbody>

                        <tr>
                            <td>
                                {transaction.debit_account}
                            </td>

                            <td>
                                R
                                {Number(
                                    transaction.amount
                                ).toFixed(2)}
                            </td>

                            <td>—</td>
                        </tr>

                        <tr>
                            <td>
                                {transaction.credit_account}
                            </td>

                            <td>—</td>

                            <td>
                                R
                                {Number(
                                    transaction.amount
                                ).toFixed(2)}
                            </td>
                        </tr>

                    </tbody>

                </table>

            </section>


            {!showReject ? (

                <div className="action-bar">

                    <button
                        className="btn-secondary"
                        onClick={() =>
                            setShowReject(true)
                        }
                        disabled={processing || transaction.status !== 'pending_review'}
                    >
                        Return Transaction
                    </button>

                    <button
                        className="btn-primary"
                        onClick={approve}
                        disabled={processing || transaction.status !== 'pending_review'}
                    >
                        {processing
                            ? "Approving..."
                            : "Approve Transaction"}
                    </button>

                </div>

            ) : (

                <section className="content-card rejection-card">

                    <h2>
                        Return Transaction
                    </h2>

                    <p>
                        Explain what needs to be
                        corrected before the client
                        can resubmit the transaction.
                    </p>

                    <textarea
                        value={reason}
                        onChange={e =>
                            setReason(e.target.value)
                        }
                        placeholder="Enter rejection reason..." aria-label="Reason for returning transaction"
                        rows="5"
                    />

                    <div className="action-bar">

                        <button
                            className="btn-secondary"
                            onClick={() =>
                                setShowReject(false)
                            }
                        >
                            Cancel
                        </button>

                        <button
                            className="btn-danger"
                            onClick={reject}
                            disabled={processing || transaction.status !== 'pending_review'}
                        >
                            {processing
                                ? "Returning..."
                                : "Return to Client"}
                        </button>

                    </div>

                </section>

            )}

        </main>
    );
}
