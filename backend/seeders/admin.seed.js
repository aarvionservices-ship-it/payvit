const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const argon2 = require("argon2");

const User = require("../src/modules/auth/model/auth.model");

const connectDB = require("../src/core/database/mongoose.connection");

const snowflake = require("../src/core/utils/distributedId");

async function seedAdmin() {

    try {

        await connectDB();

        const existingAdmin = await User.findOne({
            email: "admin@PayVit.com"
        });

        if (existingAdmin) {

            console.log("Admin already exists");
            process.exit();

        }

        const hashedPassword = await argon2.hash("admin123");

        const admin = await User.create({

            userId: snowflake.nextId(),

            name: "Super Admin",

            email: "admin@PayVit.com",

            password: hashedPassword,

            role: "admin"

        });

        console.log("Admin created successfully");
        console.log("Email: admin@PayVit.com");
        console.log("Password: admin123");

        process.exit();

    } catch (error) {

        console.error(error);
        process.exit(1);

    }

}

seedAdmin();
