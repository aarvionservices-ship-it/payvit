require("dotenv").config();
const mongoose = require('mongoose');
const Card = require('../src/modules/card/model/card.model');
const cardsDataFromFile = require('../data/cards.js');

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
        // Since the user added module.exports to cards.js, we can use it directly
        const cardsData = cardsDataFromFile.cards || cardsDataFromFile;

        if (!cardsData) {
            throw new Error('Could not find cards object in data/cards.js');
        }

        // Flatten the categorized object into a single array
        let allCards = [];
        const seenCardNames = new Set();

        for (const category in cardsData) {
            if (Array.isArray(cardsData[category])) {
                cardsData[category].forEach(card => {
                    // Ensure the category is included
                    if (!card.category) card.category = [];
                    if (!card.category.includes(category)) {
                        card.category.push(category);
                    }

                    // If card already exists in allCards (by name and bank), update categories if needed
                    const cardKey = `${card.cardName}-${card.bank}`;
                    if (seenCardNames.has(cardKey)) {
                        const existingCard = allCards.find(c => `${c.cardName}-${c.bank}` === cardKey);
                        if (existingCard && !existingCard.category.includes(category)) {
                            existingCard.category.push(category);
                        }
                    } else {
                        // Transform features from object to array of strings for frontend
                        if (card.features && typeof card.features === 'object' && !Array.isArray(card.features)) {
                            const featuresList = [];
                            for (const [key, value] of Object.entries(card.features)) {
                                const friendlyKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                if (typeof value === 'boolean') {
                                    if (value) featuresList.push(friendlyKey);
                                } else if (value) {
                                    featuresList.push(`${friendlyKey}: ${value}`);
                                }
                            }
                            card.features = featuresList;
                        }

                        // Add default gradients based on primary category
                        const categoryGradients = {
                            'travel': 'from-blue-500 to-cyan-500',
                            'shopping': 'from-pink-500 to-rose-500',
                            'fuel': 'from-orange-500 to-amber-500',
                            'dining': 'from-red-500 to-orange-500',
                            'premium': 'from-indigo-900 to-purple-900',
                            'beginner': 'from-green-500 to-emerald-500',
                            'forex': 'from-teal-500 to-blue-500',
                            'business': 'from-slate-700 to-slate-900',
                            'secured': 'from-cyan-500 to-blue-500'
                        };
                        
                        if (!card.gradient) {
                            card.gradient = categoryGradients[category] || 'from-slate-500 to-slate-700';
                        }

                        allCards.push(card);
                        seenCardNames.add(cardKey);
                    }
                });
            }
        }

        if (allCards.length === 0) {
            throw new Error('No cards found to import.');
        }

        await Card.deleteMany();
        await Card.insertMany(allCards);

        console.log(`Successfully imported ${allCards.length} cards!`);
        process.exit();
    } catch (error) {
        console.error(`Import Error: ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Card.deleteMany();
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
