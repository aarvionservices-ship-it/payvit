const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");

const sanitize = require("./middlewares/sanitize");

const rateLimiter = require("./middlewares/rateLimiter");
const errorHandler = require("./middlewares/errorHandler");
const requestLogger = require("./middlewares/requestLogger");
const decryptRequest = require("./middlewares/decryptRequest.middleware");

const authRoutes = require("./modules/auth/routes/auth.routes");
const userRoutes = require("./modules/user/routes/user.routes");
const leadRoutes = require("./modules/lead/routes/lead.routes");
const affiliateRoutes = require("./modules/affiliate/routes/affiliate.routes");
const adminRoutes = require("./modules/admin/routes/admin.routes");
const analyticsRoutes = require("./modules/analytics/routes/analytics.routes");
const cardRoutes = require("./modules/card/routes/card.routes");
const loanRoutes = require("./modules/loan/routes/loan.routes");
const settingsRoutes = require("./modules/settings/routes/settings.routes");
const leadHistoryRoutes = require("./modules/leadHistory/routes/leadHistory.routes");
const backupRoutes = require("./modules/backup/routes/backup.routes");
const rechargeRoutes = require("./modules/recharge/routes/recharge.routes");
const blogRoutes = require("./modules/blog/routes/blog.routes");
const emailTemplateRoutes = require("./modules/emailTemplate/routes/emailTemplate.routes");
const healthRoutes = require("./modules/health/routes/health.routes");

// Initialize Subscribers
require("./modules/leadHistory/subscriber/leadHistory.subscriber");

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];

app.use(helmet());

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true
    })
);
app.use(compression());

app.use(express.json({ limit: "50mb" }));

app.use(decryptRequest);
app.use(sanitize());

app.use(rateLimiter);

app.use(requestLogger);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/affiliates", affiliateRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/cards", cardRoutes);
app.use("/api/v1/loans", loanRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/lead-history", leadHistoryRoutes);
app.use("/api/v1/backup", backupRoutes);
app.use("/api/v1/recharges", rechargeRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/email-templates", emailTemplateRoutes);
app.use("/api/v1/health", healthRoutes);


app.use(errorHandler);

module.exports = app;