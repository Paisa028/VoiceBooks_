// Converts a Date object to YYYY-MM-DD format
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Checks whether a year, month and day form a real date
const isValidDate = (year, month, day) => {
  const date = new Date(year, month, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  );
};

// Detects a transaction date from the transcript
const parseTransactionDate = (transcript) => {
  if (!transcript || !transcript.trim()) {
    return null;
  }

  const cleanedTranscript = transcript.trim();
  const lowerTranscript = cleanedTranscript.toLowerCase();

  const months = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  // -----------------------------------
  // Today
  // -----------------------------------

  if (lowerTranscript.includes("today")) {
    return formatDate(new Date());
  }

  // -----------------------------------
  // Yesterday
  // -----------------------------------

  if (lowerTranscript.includes("yesterday")) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return formatDate(yesterday);
  }

  // -----------------------------------
  // YYYY-MM-DD
  // Example: 2025-12-28
  // -----------------------------------

  const isoDateMatch = lowerTranscript.match(
    /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/
  );

  if (isoDateMatch) {
    const year = Number(isoDateMatch[1]);
    const month = Number(isoDateMatch[2]) - 1;
    const day = Number(isoDateMatch[3]);

    if (isValidDate(year, month, day)) {
      return formatDate(new Date(year, month, day));
    }
  }

  // -----------------------------------
  // Numeric dates
  // Supports:
  // 28/12/2025 -> DD/MM/YYYY
  // 12/28/2025 -> MM/DD/YYYY when
  // the second number cannot be a month
  // -----------------------------------

  const numericDateMatch = lowerTranscript.match(
    /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/
  );

  if (numericDateMatch) {
    const first = Number(numericDateMatch[1]);
    const second = Number(numericDateMatch[2]);
    const year = Number(numericDateMatch[3]);

    let day;
    let month;

    // Example: 12/28/2025 must be MM/DD/YYYY
    if (second > 12 && first <= 12) {
      month = first - 1;
      day = second;
    } else {
      // Default to DD/MM/YYYY
      day = first;
      month = second - 1;
    }

    if (isValidDate(year, month, day)) {
      return formatDate(new Date(year, month, day));
    }
  }

  // -----------------------------------
  // Day Month Year
  // Examples:
  // 28 December
  // 28 December 2025
  // 28th December 2025
  // -----------------------------------

  const dayMonthMatch = lowerTranscript.match(
    /\b(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?\b/
  );

  if (dayMonthMatch) {
    const day = Number(dayMonthMatch[1]);
    const month = months[dayMonthMatch[2]];
    const year = dayMonthMatch[3]
      ? Number(dayMonthMatch[3])
      : new Date().getFullYear();

    if (isValidDate(year, month, day)) {
      return formatDate(new Date(year, month, day));
    }
  }

  // -----------------------------------
  // Month Day Year
  // Examples:
  // December 28
  // December 28 2025
  // December 28th 2025
  // -----------------------------------

  const monthDayMatch = lowerTranscript.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/
  );

  if (monthDayMatch) {
    const month = months[monthDayMatch[1]];
    const day = Number(monthDayMatch[2]);
    const year = monthDayMatch[3]
      ? Number(monthDayMatch[3])
      : new Date().getFullYear();

    if (isValidDate(year, month, day)) {
      return formatDate(new Date(year, month, day));
    }
  }

  return null;
};

module.exports = {
  parseTransactionDate,
};