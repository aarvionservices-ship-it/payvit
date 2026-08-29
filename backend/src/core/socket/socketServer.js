/**
 * socketServer.js
 *
 * Initialises and owns the Socket.io server instance.
 *
 * Usage:
 *   const { initSocketServer } = require("./core/socket/socketServer");
 *   initSocketServer(httpServer);   // called once in server.js
 *
 *   // anywhere else:
 *   const { getIO } = require("./core/socket/socketServer");
 *   getIO().to(roomId).emit("event", data);
 */

const { Server } = require("socket.io");
const config     = require("../config/env.config");

let io = null;

/**
 * Attach Socket.io to the given http.Server and apply CORS / transport config.
 * All tunable settings come from env.config (set via .env).
 *
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
function initSocketServer(httpServer) {
    const allowedOrigins = config.socket.corsOrigins;

    io = new Server(httpServer, {
        cors: {
            origin: function (origin, callback) {
                // Allow same origins as the REST CORS policy
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error(`Socket.io CORS blocked origin: ${origin}`));
                }
            },
            methods:     ["GET", "POST"],
            credentials: true
        },

        // Allow both WebSocket and long-polling fallback
        transports: ["websocket", "polling"],

        // Ping / keepalive — from .env (SOCKET_PING_TIMEOUT / SOCKET_PING_INTERVAL)
        pingTimeout:  config.socket.pingTimeout,
        pingInterval: config.socket.pingInterval,

        // Max payload for base64 webcam frames — from .env (SOCKET_MAX_BUFFER)
        maxHttpBufferSize: config.socket.maxHttpBufferSize
    });

    console.log(
        `[Socket.io] Server initialised` +
        ` | pingTimeout=${config.socket.pingTimeout}ms` +
        ` | pingInterval=${config.socket.pingInterval}ms` +
        ` | maxBuffer=${config.socket.maxHttpBufferSize / 1e6}MB`
    );

    return io;
}

/**
 * Returns the existing Socket.io instance.
 * Throws if called before initSocketServer().
 *
 * @returns {import("socket.io").Server}
 */
function getIO() {
    if (!io) {
        throw new Error("Socket.io has not been initialised. Call initSocketServer(httpServer) first.");
    }
    return io;
}

/**
 * Gracefully closes the Socket.io server.
 * Disconnects all clients cleanly before the process exits.
 * Called from server.js SIGTERM / SIGINT handlers.
 *
 * @returns {Promise<void>}
 */
function closeSocketServer() {
    return new Promise((resolve) => {
        if (!io) return resolve();
        io.close(() => {
            console.log("[Socket.io] Server closed gracefully");
            resolve();
        });
    });
}

module.exports = { initSocketServer, getIO, closeSocketServer };

