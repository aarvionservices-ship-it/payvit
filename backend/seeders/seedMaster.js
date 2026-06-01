const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const argon2 = require("argon2");

// Database models
const User = require("../src/modules/auth/model/auth.model");
const Card = require("../src/modules/card/model/card.model");
const Loan = require("../src/modules/loan/model/loan.model");
const Settings = require("../src/modules/settings/model/settings.model");

// Database & Snowflake utils
const connectDB = require("../src/core/database/mongoose.connection");
const snowflake = require("../src/core/utils/distributedId");

// Raw data sources
const cardsDataFromFile = require("../data/fintech.cards.json");
const loansData = require("../data/fintech.loans.json");

const categories = [
  {
    id: "travel",
    name: "Travel",
    theme: "from-[#0055ff] to-cyan-500",
    icon: "flight",
    imageUrl: "https://plus.unsplash.com/premium_photo-1664368832311-7fe635e32c7c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    quote: "Explore the world with benefits that take you further.",
    color: "text-[#0055ff]"
  },
  {
    id: "shopping",
    name: "Shopping",
    theme: "from-pink-500 to-rose-500",
    icon: "shopping_bag",
    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1000",
    quote: "Reward your every shopping spree with cashback and points.",
    color: "text-pink-500"
  },
  {
    id: "fuel",
    name: "Fuel",
    theme: "from-orange-500 to-amber-500",
    icon: "local_gas_station",
    imageUrl: "https://plus.unsplash.com/premium_photo-1664360971732-8d00dba158f1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    quote: "Fuel your drive with massive savings on every fill-up.",
    color: "text-orange-500"
  },
  {
    id: "dining",
    name: "Dining",
    theme: "from-red-500 to-orange-500",
    icon: "restaurant",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000",
    quote: "Savor the flavors with exclusive dining discounts.",
    color: "text-red-500"
  },
  {
    id: "premium",
    name: "Premium",
    theme: "from-indigo-900 to-purple-900",
    icon: "military_tech",
    imageUrl: "https://images.unsplash.com/photo-1618418721668-0d1f72aa4bab?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    quote: "Experience the pinnacle of luxury and exclusive benefits.",
    color: "text-indigo-900"
  },
  {
    id: "beginner",
    name: "Beginner",
    theme: "from-green-500 to-emerald-500",
    icon: "rocket_launch",
    imageUrl: "https://images.unsplash.com/photo-1673515334462-8ec684bd664b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    quote: "Start your financial journey with the perfect first card.",
    color: "text-green-500"
  },
  {
    id: "forex",
    name: "Forex",
    theme: "from-teal-500 to-blue-500",
    icon: "language",
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=1000",
    quote: "Go global without borders with zero-markup forex cards.",
    color: "text-teal-500"
  },
  {
    id: "business",
    name: "Business",
    theme: "from-slate-700 to-slate-900",
    icon: "business_center",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
    quote: "Empower your business with smarter spending solutions.",
    color: "text-slate-800"
  },
  {
    id: "secured",
    name: "Secured",
    theme: "from-cyan-500 to-blue-500",
    icon: "lock",
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000",
    quote: "Build your credit score with speed and security.",
    color: "text-cyan-500"
  }
];

async function seedMaster() {
    try {
        console.log("Master Seed: Initiating connection to MongoDB...");
        await connectDB();
        console.log("Master Seed: Database connection established.");

        // 1. Seed Admin User
        console.log("Master Seed: Checking for existing admin user...");
        
        // Try dropping legacy user phone_no_1 index if it exists in current collection
        try {
            await User.collection.dropIndex("phone_no_1");
            console.log("Master Seed: Legacy unique index 'phone_no_1' dropped successfully.");
        } catch (e) {
            // Legacy index not found, ignore error
        }

        const existingAdmin = await User.findOne({ email: "admin@PayVit.com" });

        if (!existingAdmin) {
            console.log("Master Seed: Admin user not found. Creating Super Admin...");
            const hashedPassword = await argon2.hash("admin123");
            await User.create({
                userId: snowflake.nextId(),
                name: "Super Admin",
                email: "admin@PayVit.com",
                password: hashedPassword,
                phone: "9999999999",
                role: "admin"
            });
            console.log("Master Seed: Admin created successfully!");
            console.log("Email: admin@PayVit.com");
            console.log("Password: admin123");
        } else {
            console.log("Master Seed: Admin already exists.");
        }

        // 2. Seed Cards
        console.log("Master Seed: Seeding cards...");
        const cardsData = cardsDataFromFile.cards || cardsDataFromFile;
        if (!cardsData) {
            throw new Error("Could not locate cards list in data/fintech.cards.json");
        }

        let allCards = [];
        const seenCardNames = new Set();

        if (Array.isArray(cardsData)) {
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

            cardsData.forEach(card => {
                if (card._id && card._id.$oid) {
                    card._id = card._id.$oid;
                }
                if (card.createdAt && card.createdAt.$date) {
                    card.createdAt = new Date(card.createdAt.$date);
                }
                if (card.updatedAt && card.updatedAt.$date) {
                    card.updatedAt = new Date(card.updatedAt.$date);
                }

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

                if (!card.gradient) {
                    const primaryCategory = Array.isArray(card.category) ? card.category[0] : card.category;
                    card.gradient = categoryGradients[primaryCategory] || 'from-slate-500 to-slate-700';
                }

                allCards.push(card);
            });
        } else {
            for (const category in cardsData) {
                if (Array.isArray(cardsData[category])) {
                    cardsData[category].forEach(card => {
                        if (!card.category) card.category = [];
                        if (!card.category.includes(category)) {
                            card.category.push(category);
                        }

                        const cardKey = `${card.cardName}-${card.bank}`;
                        if (seenCardNames.has(cardKey)) {
                            const existingCard = allCards.find(c => `${c.cardName}-${c.bank}` === cardKey);
                            if (existingCard && !existingCard.category.includes(category)) {
                                existingCard.category.push(category);
                            }
                        } else {
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
        }

        if (allCards.length === 0) {
            throw new Error("No cards found to import.");
        }

        await Card.deleteMany();
        await Card.insertMany(allCards);
        console.log(`Master Seed: Successfully seeded ${allCards.length} cards.`);

        // 3. Seed Loans
        console.log("Master Seed: Seeding loans...");
        if (!loansData || !Array.isArray(loansData)) {
            throw new Error("Could not find loans array in data/fintech.loans.json");
        }

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
            if (loan._id && loan._id.$oid) {
                loan._id = loan._id.$oid;
            }
            if (loan.createdAt && loan.createdAt.$date) {
                loan.createdAt = new Date(loan.createdAt.$date);
            }
            if (loan.updatedAt && loan.updatedAt.$date) {
                loan.updatedAt = new Date(loan.updatedAt.$date);
            }
            if (!loan.gradient) {
                loan.gradient = providerGradients[loan.provider] || 'from-slate-500 to-slate-700';
            }
            if (!loan.bankName) {
                loan.bankName = loan.provider || "Partner Bank";
            }
            if (!loan.category) {
                const type = loan.loanType || "General";
                loan.category = type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ") + " Loan";
            }
            if (!loan.imageUrl) {
                loan.imageUrl = "";
            }
            return loan;
        });

        await Loan.deleteMany();
        await Loan.insertMany(loansToImport);
        console.log(`Master Seed: Successfully seeded ${loansToImport.length} loans.`);

        // 4. Seed Settings
        console.log("Master Seed: Seeding general platform settings...");
        await Settings.deleteMany({ key: 'app_settings' });
        await Settings.create({
            key: 'app_settings',
            ui: {
                categories: categories,
                hero: {
                    title: 'Find Your Perfect Card',
                    subtitle: 'Curated financial products for your lifestyle'
                }
            },
            general: {
                platformName: 'PayVit',
                autoLeadAssignment: true
            },
            communication: {
                supportEmail: 'support@PayVit.com',
                supportPhone: '+91 1800 123 4567',
                address: 'Mumbai, Maharashtra, India'
            }
        });
        console.log("Master Seed: Successfully seeded app settings.");

        console.log("Master Seed: Seeding process completed successfully!");
        mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error("Master Seed: Critical Error encountered:", error);
        mongoose.connection.close();
        process.exit(1);
    }
}

seedMaster();
