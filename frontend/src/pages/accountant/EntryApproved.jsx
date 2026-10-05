export default function EntryApproved({
    transaction,
    onContinue
}) {
    return (
        <main className="success-page">

            <div className="success-icon">
                ✓
            </div>

            <p className="eyebrow">
                ACCOUNTING ENTRY
            </p>

            <h1>
                Entry Approved
            </h1>

            <p>
                The transaction has been successfully
                approved by the accountant.
            </p>


            <div className="success-summary">

                <div>
                    <span>Transaction</span>

                    <strong>
                        {transaction?.description}
                    </strong>
                </div>

                <div>
                    <span>Amount</span>

                    <strong>
                        R
                        {Number(
                            transaction?.amount || 0
                        ).toFixed(2)}
                    </strong>
                </div>

                <div>
                    <span>Status</span>

                    <strong>
                        Approved
                    </strong>
                </div>

            </div>


            <button
                className="btn-primary"
                onClick={onContinue}
            >
                Back to Dashboard
            </button>

        </main>
    );
}
