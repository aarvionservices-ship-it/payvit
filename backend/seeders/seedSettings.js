const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Settings = require('../src/modules/settings/model/settings.model');

dotenv.config();

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

const seedSettings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

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

        console.log('Settings seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding settings:', error);
        process.exit(1);
    }
};

seedSettings();

