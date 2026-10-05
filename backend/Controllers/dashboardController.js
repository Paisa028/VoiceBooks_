const pool = require("../config/db");

const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get total income
        const incomeResult = await pool.query(
            `
            SELECT COALESCE(SUM(amount), 0) AS total_income
            FROM transactions
            WHERE user_id = $1
            AND transaction_type = 'Income'
            `,
            [userId]
        );

        // Get total expenses
        const expenseResult = await pool.query(
            `
            SELECT COALESCE(SUM(amount), 0) AS total_expenses
            FROM transactions
            WHERE user_id = $1
            AND transaction_type = 'Expense'
            `,
            [userId]
        );

        // Get recent transactions
        const transactionsResult = await pool.query(
            `
            SELECT
                id,
                transaction_reference,
                transaction_date,
                description,
                amount,
                transaction_type,
                status,
                category
            FROM transactions
            WHERE user_id = $1
            ORDER BY transaction_date DESC, created_at DESC
            LIMIT 5
            `,
            [userId]
        );

        const totalIncome = Number(incomeResult.rows[0].total_income);
        const totalExpenses = Number(expenseResult.rows[0].total_expenses);

        const currentBalance = totalIncome - totalExpenses;

        res.status(200).json({
            success: true,
            data: {
                totalIncome,
                totalExpenses,
                currentBalance,
                recentTransactions: transactionsResult.rows
            }
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve dashboard information"
        });
    }
};

module.exports = {
    getDashboardSummary
};