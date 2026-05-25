require("dotenv").config();
const mongoose = require('mongoose');
const Loan = require('../src/modules/loan/model/loan.model');
const loansData = require('../data/mockLoan');

// Connect to Database
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        if (!loansData || !Array.isArray(loansData)) {
            throw new Error('Could not find loans array in data/mockLoan.js');
        }

        // Add default gradients and imageUrls if needed
        const providerGradients = {
            'Axis Bank': 'from-red-600 to-red-800',
            'State Bank of India': 'from-blue-600 to-blue-800',
            'HDFC Bank': 'from-blue-500 to-blue-700',
            'ICICI Bank': 'from-orange-500 to-orange-700',
            'Bajaj Finance': 'from-cyan-600 to-cyan-800',
            'Kotak Mahindra Bank': 'from-red-600 to-red-700',
            'Punjab National Bank': 'from-red-800 to-red-900',
            'Bank of Baroda': 'from-orange-600 to-orange-800',
            'Canara Bank': 'from-blue-700 to-blue-900'
        };

        const loansToImport = loansData.map(loan => {
            if (!loan.gradient) {
                loan.gradient = providerGradients[loan.provider] || 'from-slate-500 to-slate-700';
            }
            return loan;
        });

        await Loan.deleteMany();
        await Loan.insertMany(loansToImport);

        console.log(`Successfully imported ${loansToImport.length} loans!`);
        process.exit();
    } catch (error) {
        if (error.name === 'ValidationError') {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation Error at ${key}:`, error.errors[key].message);
            });
        } else {
            console.error(`Import Error:`, error);
        }
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Loan.deleteMany();
        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`Destroy Error: ${error.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    connectDB().then(importData);
}
