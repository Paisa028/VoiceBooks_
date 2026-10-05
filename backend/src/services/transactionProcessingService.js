// Imports the date parser
const {
  parseTransactionDate,
} = require("../utils/dateParser");

// Processes a transaction transcript and prepares it for analysis
const processTransaction = async (transcript) => {
  // Validates that a transcript was provided
  if (!transcript || !transcript.trim()) {
    throw new Error("A transaction transcript is required.");
  }

  const cleanedTranscript = transcript.trim();
  const lowerTranscript = cleanedTranscript.toLowerCase();

  // Accounting vocabulary recognised by VoiceBooks
  const accountingKeywords = {
    income: [
      "received",
      "earned",
      "sold",
      "sale",
      "income",
      "revenue",
      "customer payment",
      "customer paid",
      "deposit received",
    ],

    expense: [
      "bought",
      "purchased",
      "paid",
      "spent",
      "expense",
      "supplier payment",
      "supplier paid",
      "bill",
    ],
  };

  // -----------------------------------
  // Detects the transaction amount
  // -----------------------------------

  const amountMatch = cleanedTranscript.match(
    /(?:R\s?([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s?(?:rand|rands))/i
  );

  let amount = null;

  if (amountMatch) {
    const amountText = amountMatch[1] || amountMatch[2];
    amount = Number(amountText.replace(/,/g, ""));
  }

  // -----------------------------------
  // Detects the transaction type
  // -----------------------------------

  let type = null;

  if (
    accountingKeywords.expense.some((word) =>
      lowerTranscript.includes(word)
    )
  ) {
    type = "expense";
  }

  if (
    accountingKeywords.income.some((word) =>
      lowerTranscript.includes(word)
    )
  ) {
    type = "income";
  }

  // -----------------------------------
  // Detects the payment method
  // -----------------------------------

  let paymentMethod = null;

  if (lowerTranscript.includes("cash")) {
    paymentMethod = "cash";
  } else if (
    lowerTranscript.includes("bank transfer") ||
    lowerTranscript.includes("eft")
  ) {
    paymentMethod = "bank transfer";
  } else if (lowerTranscript.includes("credit card")) {
    paymentMethod = "credit card";
  } else if (lowerTranscript.includes("debit card")) {
    paymentMethod = "debit card";
  } else if (lowerTranscript.includes("credit")) {
    paymentMethod = "credit";
  } else if (
    lowerTranscript.includes("bank account") ||
    lowerTranscript.includes("bank")
  ) {
    paymentMethod = "bank";
  }

  // -----------------------------------
  // Detects the description
  // -----------------------------------

  let description = null;

  const purchaseDescriptionMatch = cleanedTranscript.match(
    /\b(?:bought|purchased)\s+(.+?)(?=\s+from\s+)/i
  );

  const serviceDescriptionMatch = cleanedTranscript.match(
    /\bfor\s+(.+?)(?=[.,]|$)/i
  );

  if (purchaseDescriptionMatch) {
    description = purchaseDescriptionMatch[1].trim();
  } else if (serviceDescriptionMatch) {
    description = serviceDescriptionMatch[1]
      .replace(
        /\s+(?:cash|eft|bank transfer|credit card|debit card|credit)$/i,
        ""
      )
      .trim();
  }

  // -----------------------------------
  // Detects the customer or supplier
  // -----------------------------------

  let party = null;

  const partyPatterns = [
    /\bfrom\s+([A-Za-z][A-Za-z0-9 &'.-]*?)(?=\s+(?:for|on|using|via|by|worth|R\d|\d+\s*(?:rand|rands))|[.,]|$)/i,

    /\bto\s+([A-Za-z][A-Za-z0-9 &'.-]*?)(?=\s+(?:for|on|using|via|by|worth|R\d|\d+\s*(?:rand|rands))|[.,]|$)/i,

    /\bsupplier\s+([A-Za-z][A-Za-z0-9 &'.-]*?)(?=\s+(?:for|on|using|via|by|worth|R\d|\d+\s*(?:rand|rands))|[.,]|$)/i,

    /\bcustomer\s+([A-Za-z][A-Za-z0-9 &'.-]*?)(?=\s+(?:for|on|using|via|by|worth|R\d|\d+\s*(?:rand|rands))|[.,]|$)/i,
  ];

  const ignoredParties = [
    "the business bank account",
    "business bank account",
    "the bank account",
    "bank account",
    "the bank",
  ];

  for (const pattern of partyPatterns) {
    const partyMatch = cleanedTranscript.match(pattern);

    if (partyMatch) {
      const detectedParty = partyMatch[1].trim();

      if (!ignoredParties.includes(detectedParty.toLowerCase())) {
        party = detectedParty;
        break;
      }
    }
  }

  // -----------------------------------
  // Determines customer or supplier
  // -----------------------------------

  let partyType = null;

  if (party) {
    if (
      type === "expense" ||
      lowerTranscript.includes("supplier")
    ) {
      partyType = "supplier";
    } else if (
      type === "income" ||
      lowerTranscript.includes("customer")
    ) {
      partyType = "customer";
    }
  }

  // -----------------------------------
  // Detects transaction date
  // -----------------------------------

  const transactionDate =
    parseTransactionDate(cleanedTranscript);

  // -----------------------------------
  // Detects invoice/reference number
  // -----------------------------------

  let reference = null;

  const referencePatterns = [
    /\binvoice\s+(?:number\s+|no\.?\s*)?([A-Za-z0-9-]+)/i,
    /\breference\s+(?:number\s+|no\.?\s*)?([A-Za-z0-9-]+)/i,
    /\bref\.?\s*([A-Za-z0-9-]+)/i,
  ];

  for (const pattern of referencePatterns) {
    const referenceMatch = cleanedTranscript.match(pattern);

    if (referenceMatch) {
      reference = referenceMatch[1].trim();
      break;
    }
  }

  // -----------------------------------
  // Detects account category
  // -----------------------------------

  let accountCategory = null;

  const accountCategories = [
    {
      category: "Stationery",
      keywords: [
        "stationery",
        "office supplies",
        "printer paper",
        "printing paper",
        "pens",
        "pencils",
      ],
    },
    {
      category: "Utilities",
      keywords: [
        "electricity",
        "water",
        "utilities",
        "municipal",
        "municipality",
      ],
    },
    {
      category: "Fuel",
      keywords: [
        "fuel",
        "petrol",
        "diesel",
      ],
    },
    {
      category: "Rent",
      keywords: [
        "rent",
        "rental",
        "office rent",
        "shop rent",
      ],
    },
    {
      category: "Materials",
      keywords: [
        "materials",
        "building materials",
        "parts",
        "supplies",
      ],
    },
    {
      category: "Repairs and Maintenance",
      keywords: [
        "repair",
        "repairs",
        "maintenance",
        "equipment repair",
      ],
    },
    {
      category: "Service Revenue",
      keywords: [
        "plumbing service",
        "plumbing services",
        "electrical service",
        "electrical services",
        "installation service",
        "installation services",
        "repair service",
        "repair services",
        "labour",
      ],
    },
    {
      category: "Sales Revenue",
      keywords: [
        "sale",
        "sales",
        "sold",
        "goods sold",
        "product sale",
      ],
    },
  ];

  for (const account of accountCategories) {
    const categoryFound = account.keywords.some((keyword) =>
      lowerTranscript.includes(keyword)
    );

    if (categoryFound) {
      accountCategory = account.category;
      break;
    }
  }

  // -----------------------------------
  // Detects VAT information
  // -----------------------------------

  const VAT_RATE = 0.15;

  let vatApplicable = false;
  let vatInclusive = null;
  let vatRate = null;
  let vatAmount = null;

  if (lowerTranscript.includes("vat")) {
    vatApplicable = true;
    vatRate = 15;

    if (
      lowerTranscript.includes("including vat") ||
      lowerTranscript.includes("inclusive of vat") ||
      lowerTranscript.includes("vat inclusive")
    ) {
      vatInclusive = true;
    }

    if (
      lowerTranscript.includes("excluding vat") ||
      lowerTranscript.includes("exclusive of vat") ||
      lowerTranscript.includes("vat exclusive")
    ) {
      vatInclusive = false;
    }

    const explicitVatMatch = cleanedTranscript.match(
      /\bvat(?:\s+(?:of|amount(?:\s+of)?))?\s*(?:is\s*)?R\s?([\d,]+(?:\.\d{1,2})?)/i
    );

    if (explicitVatMatch) {
      vatAmount = Number(
        explicitVatMatch[1].replace(/,/g, "")
      );
    } else if (
      amount !== null &&
      vatInclusive === true
    ) {
      vatAmount = Number(
        (amount - amount / (1 + VAT_RATE)).toFixed(2)
      );
    } else if (
      amount !== null &&
      vatInclusive === false
    ) {
      vatAmount = Number(
        (amount * VAT_RATE).toFixed(2)
      );
    }
  }

  // -----------------------------------
  // Creates the transaction
  // -----------------------------------

  const transaction = {
    originalTranscript: cleanedTranscript,
    type,
    amount,
    party,
    partyType,
    description,
    accountCategory,
    paymentMethod,
    transactionDate,
    reference,
    vatApplicable,
    vatInclusive,
    vatRate,
    vatAmount,
  };

  return transaction;
};

module.exports = {
  processTransaction,
};