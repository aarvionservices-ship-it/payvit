// Load env variables first, before any app modules are imported
require("dotenv").config({ quiet: true });
process.env.NODE_ENV = "test";
process.env.VIDEO_KYC_MOCK_MODE = "true";
process.env.VIDEO_KYC_REQUIRE_OTP = "true";
process.env.PAN_MOCK_MODE = "true";
process.env.AADHAAR_MOCK_MODE = "true";

// Load RSA keys so decryptRequest middleware does not crash
// The middleware gracefully falls through when no encrypted payload is present,
// but keyLoader must still be initialised at import time.
const keyLoader = require("../src/core/security/keyLoader");
try {
    keyLoader.loadKeys();
} catch {
    // Keys may not exist in CI — decryptRequest falls through when privateKey is null
}

const mongoose = require("mongoose");

// Test database — completely isolated from the dev/prod database
const TEST_MONGO_URI =
    process.env.MONGO_URI_TEST || "mongodb://localhost:27017/payvit-test";

/**
 * Monkey-patch Mongoose transaction APIs for standalone (non-replica-set) MongoDB.
 *
 * The production `connectDB()` (src/core/database/mongoose.connection.js) already
 * applies this patch when started via server.js.  Tests bypass server.js and
 * connect directly, so we must re-apply the patch here to prevent:
 *   MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
 */
function stubTransactionsForStandalone() {
    const isStandalone =
        mongoose.connection.client?.topology?.description?.type === "Single";

    if (!isStandalone) return; // replica set or Atlas — no patch needed

    const originalStartSession = mongoose.startSession.bind(mongoose);
    mongoose.startSession = async function (...args) {
        const session = await originalStartSession(...args);
        session.startTransaction = () => {};           // no-op
        session.commitTransaction = async () => {};    // no-op
        session.abortTransaction = async () => {};     // no-op
        return session;
    };
}

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_MONGO_URI);
    }
    stubTransactionsForStandalone();
});

afterAll(async () => {
    await mongoose.connection.close();
});

// Wipe every collection before each test for a clean, predictable state
beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});
