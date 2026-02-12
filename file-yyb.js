const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

const seedData = async () => {
    try {
        // Clear existing data
        await Product.deleteMany({});
        await User.deleteMany({});

        // Create admin user
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@gamezone.com',
            phone: '9999999999',
            password: 'admin123',
            role: 'admin'
        });

        // Create products
        const products = [
            {
                name: "GTA VI",
                description: "Grand Theft Auto VI - The most anticipated game of the decade. Experience Vice City like never before.",
                price: 4999, originalPrice: 5499,
                platform: "ps5", condition: "new", category: "game",
                emoji: "🌴", stock: 25,
                rating: { average: 4.9, count: 150 },
                tags: ["action", "open-world", "rockstar"],
                isFeatured: true, isDeal: true, seller: admin._id
            },
            {
                name: "Spider-Man 2",
                description: "Marvel's Spider-Man 2 - Swing through NYC as both Peter Parker and Miles Morales.",
                price: 2499, originalPrice: 3999,
                platform: "ps5", condition: "excellent", category: "game",
                emoji: "🕷️", stock: 15,
                rating: { average: 4.8, count: 200 },
                tags: ["action", "superhero", "marvel"],
                isFeatured: true, isDeal: true, seller: admin._id
            },
            {
                name: "God of War Ragnarok",
                description: "Join Kratos and Atreus on an epic journey through the Nine Realms.",
                price: 1999, originalPrice: 3499,
                platform: "ps5", condition: "good", category: "game",
                emoji: "⚔️", stock: 10,
                rating: { average: 4.9, count: 300 },
                tags: ["action", "adventure", "mythology"],
                isDeal: true, seller: admin._id
            },
            {
                name: "Halo Infinite",
                description: "Master Chief returns in the most expansive Halo game ever.",
                price: 1499, originalPrice: 2999,
                platform: "xbox", condition: "good", category: "game",
                emoji: "🔫", stock: 12,
                rating: { average: 4.3, count: 100 },
                tags: ["fps", "sci-fi", "multiplayer"],
                isDeal: true, seller: admin._id
            },
            {
                name: "Zelda: Tears of the Kingdom",
                description: "Explore the vast lands and skies of Hyrule in this sequel to Breath of the Wild.",
                price: 3499, originalPrice: 4499,
                platform: "nintendo", condition: "new", category: "game",
                emoji: "🗡️", stock: 20,
                rating: { average: 4.9, count: 250 },
                tags: ["adventure", "rpg", "nintendo"],
                isFeatured: true, seller: admin._id
            },
            {
                name: "FIFA 25",
                description: "The beautiful game with next-gen HyperMotion technology.",
                price: 1999, originalPrice: 3499,
                platform: "ps5", condition: "like-new", category: "game",
                emoji: "⚽", stock: 30,
                rating: { average: 4.0, count: 180 },
                tags: ["sports", "football", "multiplayer"],
                seller: admin._id
            },
            {
                name: "Forza Horizon 5",
                description: "Explore Mexico's vibrant landscapes in the ultimate racing game.",
                price: 1799, originalPrice: 2999,
                platform: "xbox", condition: "excellent", category: "game",
                emoji: "🏎️", stock: 8,
                rating: { average: 4.7, count: 160 },
                tags: ["racing", "open-world"],
                seller: admin._id
            },
            {
                name: "Cyberpunk 2077",
                description: "Navigate the dangerous streets of Night City in this open-world RPG.",
                price: 999, originalPrice: 2499,
                platform: "pc", condition: "new", category: "game",
                emoji: "🤖", stock: 50,
                rating: { average: 4.5, count: 220 },
                tags: ["rpg", "open-world", "cyberpunk"],
                isDeal: true, seller: admin._id
            },
            {
                name: "Elden Ring",
                description: "A vast world full of mystery and peril created by FromSoftware and George R.R. Martin.",
                price: 2299, originalPrice: 3499,
                platform: "ps5", condition: "excellent", category: "game",
                emoji: "💍", stock: 14,
                rating: { average: 4.8, count: 350 },
                tags: ["rpg", "souls-like", "open-world"],
                isFeatured: true, seller: admin._id
            },
            {
                name: "Red Dead Redemption 2",
                description: "Experience the epic tale of outlaw Arthur Morgan in the dying days of America's wild west.",
                price: 1299, originalPrice: 2999,
                platform: "pc", condition: "new", category: "game",
                emoji: "🤠", stock: 40,
                rating: { average: 4.9, count: 400 },
                tags: ["action", "open-world", "western"],
                seller: admin._id
            },
            {
                name: "PS5 Console (Pre-Owned)",
                description: "PlayStation 5 Console - Pre-Owned in excellent condition with controller.",
                price: 39999, originalPrice: 49999,
                platform: "console", condition: "excellent", category: "console",
                emoji: "🎮", stock: 5,
                rating: { average: 4.6, count: 50 },
                tags: ["console", "playstation"],
                isFeatured: true, seller: admin._id
            },
            {
                name: "Xbox Wireless Controller",
                description: "Official Xbox Wireless Controller - Carbon Black.",
                price: 3999, originalPrice: 5499,
                platform: "accessories", condition: "new", category: "accessory",
                emoji: "🎮", stock: 35,
                rating: { average: 4.5, count: 80 },
                tags: ["controller", "xbox", "accessory"],
                seller: admin._id
            }
        ];

        await Product.insertMany(products);

        console.log('✅ Database seeded successfully!');
        console.log(`📦 ${products.length} products added`);
        console.log(`👤 Admin: admin@gamezone.com / admin123`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seedData();