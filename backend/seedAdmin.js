const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        // Hardcoded for debugging if .env fails. Replace with your actual URI or ensure .env is read.
        // const uri = process.env.MONGO_URI || 'mongodb+srv://admin:admin123@cluster0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'; 
        // Better: print env var to check
        console.log('MONGO_URI:', process.env.MONGO_URI);

        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB Connected...');

        const adminExists = await User.findOne({ email: 'admin@gmail.com' });

        if (adminExists) {
            console.log('Admin user already exists');
            process.exit();
        }

        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@gmail.com',
            password: 'admin',
            role: 'admin',
            companyName: 'Admin Corp'
        });

        console.log('Admin user created successfully');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
