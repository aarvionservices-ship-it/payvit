const mongoose = require("mongoose");
const env = require("../config/env.config");

async function connectDB() {

    try {

        await mongoose.connect(env.mongoUri);

        console.log("MongoDB Connected");

        // Monkey-patch Mongoose transactions if running on standalone MongoDB (Single topology type)
        const isStandalone = mongoose.connection.client?.topology?.description?.type === "Single";
        if (isStandalone) {
            console.log("Mongoose Connection: Standalone MongoDB detected. Stubbing transaction sessions to prevent replica set requirement errors.");
            const originalStartSession = mongoose.startSession;
            mongoose.startSession = async function (...args) {
                const session = await originalStartSession.apply(this, args);
                session.startTransaction = function () {
                    // No-op
                };
                session.commitTransaction = async function () {
                    // No-op
                };
                session.abortTransaction = async function () {
                    // No-op
                };
                return session;
            };
        }

    } catch (err) {

        console.error("MongoDB connection error", err);
        process.exit(1);

    }

}

module.exports = connectDB;
