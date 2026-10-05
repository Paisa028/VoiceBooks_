const dashboardRoutes = require("./routes/dashboardRoutes");
const ledgerRoutes = require("./routes/ledgerRoutes");

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ledger", ledgerRoutes);