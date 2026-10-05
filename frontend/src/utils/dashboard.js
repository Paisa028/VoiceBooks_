export function dashboardSummary(transactions, now = new Date()) {
  const summary = { income: 0, expenses: 0, count: 0, pending: 0, returned: 0 };
  for (const transaction of transactions) {
    if (transaction.status === 'pending_review') summary.pending++;
    if (transaction.status === 'returned') summary.returned++;
    // Date-only business dates are compared without shifting their timezone.
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (transaction.status !== 'approved' || !transaction.transactionDate?.startsWith(month + '-')) continue;
    const amount = Math.round(Number(transaction.amount) * 100);
    if (!Number.isFinite(amount)) continue;
    if (transaction.type === 'income') summary.income += amount;
    if (transaction.type === 'expense') summary.expenses += amount;
    summary.count++;
  }
  summary.income /= 100;
  summary.expenses /= 100;
  return summary;
}
