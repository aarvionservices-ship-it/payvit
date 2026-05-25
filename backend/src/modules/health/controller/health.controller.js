const mongoose = require("mongoose");

class HealthController {
    async check(req, res) {
        const healthStatus = {
            status: "UP",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                database: {
                    status: mongoose.connection.readyState === 1 ? "UP" : "DOWN",
                    readyState: mongoose.connection.readyState
                },
                server: {
                    status: "UP",
                    memoryUsage: process.memoryUsage()
                }
            }
        };

        const isAllUp = Object.values(healthStatus.services).every(service => service.status === "UP");

        if (!isAllUp) {
            healthStatus.status = "DEGRADED";
            return res.status(503).json({
                success: false,
                ...healthStatus
            });
        }

        res.json({
            success: true,
            ...healthStatus
        });
    }
}

module.exports = new HealthController();

