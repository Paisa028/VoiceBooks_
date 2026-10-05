import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Creates the Manual Transaction screen
function ManualTransaction() {
  const navigate = useNavigate();
  
  const location = useLocation();

  // Transaction information received from Clarification
  const clarificationTransaction =
    location.state?.transaction || null;

  // Stores the transaction information entered by the user
    const [formData, setFormData] = useState({
    type:
      clarificationTransaction?.type || "",

    amount:
      clarificationTransaction?.amount ?? "",

    party:
      clarificationTransaction?.party || "",

    partyType:
      clarificationTransaction?.partyType || "",

    description:
      clarificationTransaction?.description || "",

    accountCategory:
      clarificationTransaction?.accountCategory || "",

    otherAccountCategory: "",

    paymentMethod:
      clarificationTransaction?.paymentMethod || "",

    otherPaymentMethod: "",

    transactionDate:
      clarificationTransaction?.transactionDate || "",

    reference:
      clarificationTransaction?.reference || "",

    attachment: null,

    vatApplicable:
      clarificationTransaction?.vatApplicable || false,

    vatInclusive:
      clarificationTransaction?.vatInclusive ?? null,

    vatRate:
      clarificationTransaction?.vatRate ?? null,

    vatAmount:
      clarificationTransaction?.vatAmount ?? null,
  });

  const [errorMessage, setErrorMessage] = useState("");

  // Returns to the New Transaction screen
  const goBack = () => {
    navigate("/");
  };

  // Updates text, number and select fields
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  // Handles receipt/invoice attachment
  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    const maximumFileSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "Please attach a PDF, JPG, JPEG or PNG file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > maximumFileSize) {
      setErrorMessage(
        "The attachment must be 5 MB or smaller."
      );

      event.target.value = "";
      return;
    }

    setErrorMessage("");

    setFormData((currentData) => ({
      ...currentData,
      attachment: file,
    }));
  };

  // Removes the selected attachment
  const removeAttachment = () => {
    setFormData((currentData) => ({
      ...currentData,
      attachment: null,
    }));
  };

  // Updates whether VAT applies to the transaction
  const handleVatChange = (event) => {
    const checked = event.target.checked;

    setFormData((currentData) => ({
      ...currentData,
      vatApplicable: checked,
      vatRate: checked ? 15 : null,
      vatInclusive: checked
        ? currentData.vatInclusive
        : null,
      vatAmount: checked
        ? currentData.vatAmount
        : null,
    }));
  };

  // Opens Transaction Review with the manually entered information
  const continueToReview = (event) => {
    event.preventDefault();

    setErrorMessage("");

    // Checks the main required transaction fields
    if (
      !formData.type ||
      !formData.amount ||
      !formData.description ||
      !formData.paymentMethod ||
      !formData.transactionDate
    ) {
      setErrorMessage(
        "Please complete all required transaction details before continuing."
      );
      return;
    }

    // Requires a category when Other is selected
    if (
      formData.accountCategory === "Other" &&
      !formData.otherAccountCategory.trim()
    ) {
      setErrorMessage(
        "Please specify the other account category."
      );
      return;
    }

    // Requires a payment method when Other is selected
    if (
      formData.paymentMethod === "other" &&
      !formData.otherPaymentMethod.trim()
    ) {
      setErrorMessage(
        "Please specify the other payment method."
      );
      return;
    }

    const amount = Number(formData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorMessage(
        "Please enter a valid transaction amount."
      );
      return;
    }

    // Prepares the manual transaction using the same structure
    // used by VoiceBooks transaction processing
    const transaction = {
      originalTranscript: null,

      type: formData.type,

      amount,

      party:
        formData.party.trim() || null,

      partyType:
        formData.partyType || null,

      description:
        formData.description.trim(),

      // If Other was selected, use what the user typed
      accountCategory:
        formData.accountCategory === "Other"
          ? formData.otherAccountCategory.trim()
          : formData.accountCategory || null,

      // If Other was selected, use what the user typed
      paymentMethod:
        formData.paymentMethod === "other"
          ? formData.otherPaymentMethod.trim()
          : formData.paymentMethod,

      transactionDate:
        formData.transactionDate,

      reference:
        formData.reference.trim() || null,

      attachment:
        formData.attachment,

      vatApplicable:
        formData.vatApplicable,

      vatInclusive:
        formData.vatApplicable
          ? formData.vatInclusive
          : null,

      vatRate:
        formData.vatApplicable
          ? 15
          : null,

      vatAmount:
        formData.vatApplicable &&
        formData.vatAmount !== ""
          ? Number(formData.vatAmount)
          : null,
    };

    navigate("/transactions/review", {
      state: {
        transaction,
      },
    });
  };

  return (
    <main className="transaction-page">
      <section className="transaction-container manual-transaction-container">

        {/* Page Header */}
        <header className="transaction-header">
          <button
            type="button"
            className="back-button"
            onClick={goBack}
            aria-label="Go back"
          >
            ←
          </button>

          <h1>Enter Transaction Manually</h1>
        </header>

        <p className="transaction-intro">
          Enter the transaction details below.
        </p>

        {errorMessage && (
          <p className="recording-error">
            {errorMessage}
          </p>
        )}

        <form
          className="manual-transaction-form"
          onSubmit={continueToReview}
        >
          <div className="manual-form-grid">

            {/* Transaction Type */}
            <label>
              Transaction Type *

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select transaction type
                </option>

                <option value="expense">
                  Expense
                </option>

                <option value="income">
                  Income
                </option>

                <option value="customer_receipt">
                  Customer Receipt
                </option>

                <option value="supplier_payment">
                  Supplier Payment
                </option>

                <option value="sales_invoice">
                  Sales Invoice
                </option>

                <option value="purchase_invoice">
                  Purchase Invoice
                </option>

                <option value="credit_note">
                  Credit Note
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </label>

            {/* Amount */}
            <label>
              Amount (R) *

              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                placeholder="250.00"
                required
              />
            </label>

            {/* Customer / Supplier */}
            <label>
              Customer / Supplier

              <input
                type="text"
                name="party"
                value={formData.party}
                onChange={handleChange}
                placeholder="e.g. CNA"
              />
            </label>

            {/* Party Type */}
            <label>
              Party Type

              <select
                name="partyType"
                value={formData.partyType}
                onChange={handleChange}
              >
                <option value="">
                  Select party type
                </option>

                <option value="customer">
                  Customer
                </option>

                <option value="supplier">
                  Supplier
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </label>

            {/* Description */}
            <label>
              Description *

              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Stationery"
                required
              />
            </label>

            {/* Account Category */}
            <label>
              Account Category

              <select
                name="accountCategory"
                value={formData.accountCategory}
                onChange={handleChange}
              >
                <option value="">
                  Select category
                </option>

                <option value="Stationery">
                  Stationery
                </option>

                <option value="Utilities">
                  Utilities
                </option>

                <option value="Fuel">
                  Fuel
                </option>

                <option value="Rent">
                  Rent
                </option>

                <option value="Materials">
                  Materials
                </option>

                <option value="Repairs and Maintenance">
                  Repairs and Maintenance
                </option>

                <option value="Service Revenue">
                  Service Revenue
                </option>

                <option value="Sales Revenue">
                  Sales Revenue
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </label>

            {/* Other Account Category */}
            {formData.accountCategory === "Other" && (
              <label>
                Other Account Category *

                <input
                  type="text"
                  name="otherAccountCategory"
                  value={formData.otherAccountCategory}
                  onChange={handleChange}
                  placeholder="Enter account category"
                  required
                />
              </label>
            )}

            {/* Payment Method */}
            <label>
              Payment Method *

              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select payment method
                </option>

                <option value="cash">
                  Cash
                </option>

                <option value="bank transfer">
                  Bank Transfer / EFT
                </option>

                <option value="credit card">
                  Credit Card
                </option>

                <option value="debit card">
                  Debit Card
                </option>

                <option value="online payment">
                  Online Payment
                </option>

                <option value="mobile payment">
                  Mobile Payment
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </label>

            {/* Other Payment Method */}
            {formData.paymentMethod === "other" && (
              <label>
                Other Payment Method *

                <input
                  type="text"
                  name="otherPaymentMethod"
                  value={formData.otherPaymentMethod}
                  onChange={handleChange}
                  placeholder="Enter payment method"
                  required
                />
              </label>
            )}

            {/* Transaction Date */}
            <label>
              Transaction Date *

              <input
                type="date"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleChange}
                required
              />
            </label>

            {/* Reference / Invoice Number */}
            <label>
              Reference / Invoice Number

              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="e.g. INV-001"
              />
            </label>

            {/* Receipt / Invoice Attachment */}
            <div className="manual-attachment-field">

              <span className="manual-attachment-label">
                Attach Receipt / Invoice
              </span>

              {!formData.attachment ? (
                <>
                  <label className="manual-file-button">
                    📎 Choose File

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleAttachmentChange}
                    />
                  </label>

                  <span className="manual-field-hint">
                    PDF, JPG, JPEG or PNG • Maximum 5 MB
                  </span>
                </>
              ) : (
                <div className="manual-selected-file">
                  <div>
                    <span className="manual-file-icon">
                      📄
                    </span>

                    <span className="manual-file-name">
                      {formData.attachment.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="manual-remove-file"
                    onClick={removeAttachment}
                  >
                    Remove
                  </button>
                </div>
              )}

            </div>

            {/* VAT Applicable */}
            <label className="manual-checkbox">
              <input
                type="checkbox"
                checked={formData.vatApplicable}
                onChange={handleVatChange}
              />

              VAT Applicable
            </label>

            {/* VAT Details */}
            {formData.vatApplicable && (
              <>
                <label>
                  VAT Treatment

                  <select
                    name="vatInclusive"
                    value={
                      formData.vatInclusive === null
                        ? ""
                        : String(formData.vatInclusive)
                    }
                    onChange={(event) => {
                      const value = event.target.value;

                      setFormData((currentData) => ({
                        ...currentData,

                        vatInclusive:
                          value === ""
                            ? null
                            : value === "true",
                      }));
                    }}
                  >
                    <option value="">
                      Select VAT treatment
                    </option>

                    <option value="true">
                      VAT Inclusive
                    </option>

                    <option value="false">
                      VAT Exclusive
                    </option>
                  </select>
                </label>

                <label>
                  VAT Amount (R)

                  <input
                    type="number"
                    name="vatAmount"
                    value={formData.vatAmount ?? ""}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                  />
                </label>
              </>
            )}

          </div>

          <div className="manual-form-actions">

            <button
              type="button"
              onClick={goBack}
            >
              Cancel
            </button>

            <button type="submit">
              Continue to Review
            </button>

          </div>
        </form>

      </section>
    </main>
  );
}

export default ManualTransaction;