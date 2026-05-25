const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    pincode: String,
    type: {
        type: String,
        enum: ["current", "permanent", "office"],
        default: "current"
    }
}, { _id: false });

const customerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        dob: Date,
        gender: {
            type: String,
            enum: ["male", "female", "other"]
        },
        occupation: String,
        annualIncome: Number,
        panNumber: String,
        aadhaarNumber: String,
        addresses: [addressSchema],
        profileImage: {
            data: Buffer,
            contentType: String
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("CustomerProfile", customerProfileSchema);

