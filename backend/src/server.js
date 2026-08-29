require("dotenv").config();
const http      = require("http");
const keyLoader = require("./core/security/keyLoader");
keyLoader.loadKeys();

const app       = require("./app");
const connectDB = require("./core/database/mongoose.connection");

// ─── Socket.io ────────────────────────────────────────────────────────────────
const { initSocketServer, closeSocketServer } = require("./core/socket/socketServer");
const { registerVideoKycNamespace }           = require("./modules/kyc/socket/videoKycSocket.handler");

const PORT = process.env.PORT || 5000;

async function start() {

    await connectDB();

    // Wrap Express app in a native http.Server so Socket.io can intercept
    // WebSocket upgrade requests on the same port as REST.
    const httpServer = http.createServer(app);

    // Initialise Socket.io and register all namespaces
    const io = initSocketServer(httpServer);
    registerVideoKycNamespace(io);

    httpServer.listen(PORT, () => {
        console.log(`[Server] Running on port ${PORT} (HTTP + WebSocket)`);
    });

    // ── Graceful Shutdown ─────────────────────────────────────────────────────
    // Close Socket.io connections cleanly before process exits so clients
    // receive a proper disconnect event rather than a hard TCP reset.
    async function shutdown(signal) {
        console.log(`[Server] ${signal} received — shutting down gracefully...`);
        await closeSocketServer();
        httpServer.close(() => {
            console.log("[Server] HTTP server closed. Exiting.");
            process.exit(0);
        });
        // Force exit if graceful shutdown takes too long
        setTimeout(() => {
            console.error("[Server] Forced exit after 10 s");
            process.exit(1);
        }, 10_000);
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));
}

start();