const service = require("../services/accountantService");

async function dashboard(req, res) {
    try {
        const data = await service.getDashboard(req.user.id);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load accountant dashboard"
        });
    }
}


async function clients(req, res) {
    try {
        const data = await service.getClients(req.user.id);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to load clients"
        });
    }
}


async function client(req, res) {
    try {
        const data = await service.getClientById(req.params.id, req.user.id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Client not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to load client"
        });
    }
}


async function clientTransactions(req, res) {
    try {
        const data = await service.getClientTransactions(
            req.params.id, req.user.id
            );

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to load client transactions"
        });
    }
}


async function pendingReviews(req, res) {
    try {
        const data = await service.getPendingReviews(req.user.id);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to load pending reviews"
        });
    }
}


async function reviewTransaction(req, res) {
    try {
        const data =
            await service.getTransactionForReview(
                req.params.id, req.user.id
            );

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to load transaction"
        });
    }
}


async function approve(req, res) {
    try {
        const transaction =
            await service.approveTransaction(
                req.params.id,
                req.user.id
            );

        res.json({
            success: true,
            data: transaction,
            message: "Transaction approved successfully"
        });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : 'Unable to approve transaction'
        });
    }
}


async function reject(req, res) {
    try {
        const { reason } = req.body;

        if (typeof reason !== 'string' || reason.trim().length < 5 || reason.length > 1000) {
            return res.status(400).json({
                success: false,
                message:
                    "A rejection reason of at least 5 characters is required"
            });
        }

        const transaction =
            await service.rejectTransaction(
                req.params.id,
                req.user.id,
                reason.trim()
            );

        res.json({
            success: true,
            data: transaction,
            message: "Transaction returned to client"
        });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : 'Unable to return transaction'
        });
    }
}


async function approved(req, res) {
    try {
        const data =
            await service.getApprovedTransactions(req.user.id);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to load approved transactions"
        });
    }
}


async function returned(req, res) {
    try {
        const data =
            await service.getReturnedTransactions(req.user.id);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to load returned transactions"
        });
    }
}


async function profile(req, res) {
    try {
        const data =
            await service.getAccountantProfile(
                req.user.id
            );

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to load accountant profile"
        });
    }
}


module.exports = {
    dashboard,
    clients,
    client,
    clientTransactions,
    pendingReviews,
    reviewTransaction,
    approve,
    reject,
    approved,
    returned,
    profile
};
