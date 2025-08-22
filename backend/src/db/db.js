const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('connected to db');
    } catch (error) {
        console.error("error connecting to db", error);
    }
}

module.exports = connectDB;