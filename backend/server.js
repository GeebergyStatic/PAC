const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


const uri = process.env.uri;

async function connectToMongoDB() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
}

connectToMongoDB();

// ✅ Schema
const NetworkSchema = new mongoose.Schema({
    key: String,         // "erc20", "trc20", "mainnet"
    label: String,       // "ERC-20", "TRC-20", etc.
    icon: String,        // URL of icon
    address: String,     // Wallet address
    qr: String           // QR code URL
});

const CurrencySchema = new mongoose.Schema({
    coin: String,        // "btc", "eth", "usdt"
    name: String,        // "Bitcoin", "Ethereum", etc.
    icon: String,        // URL of coin icon
    networks: [NetworkSchema]
});

const Currency = mongoose.model('Currency', CurrencySchema);

// ✅ Routes
app.get('/api/currencies', async (req, res) => {
    const currencies = await Currency.find();
    res.json(currencies);
});

// app.post('/api/currencies', async (req, res) => {
//     try {
//         const currency = new Currency(req.body);
//         await currency.save();
//         res.status(201).json(currency);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

// ✅ Start server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
