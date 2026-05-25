const mongoose = require("mongoose");
const env = require("../config/env.config");

async function connectDB() {

    try {

        await mongoose.connect(env.mongoUri);

        console.log("MongoDB Connected");

    } catch (err) {

        console.error("MongoDB connection error", err);
        process.exit(1);

    }

}

module.exports = connectDB;
