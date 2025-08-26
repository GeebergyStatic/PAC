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

const donationSchema = new mongoose.Schema({
    coin: { type: String, required: true },         // e.g. BTC, ETH, USDT
    network: { type: String, required: true },      // e.g. ERC20, BEP20
    address: { type: String, required: true },      // wallet address
    amountUSD: { type: Number, required: true },    // donation amount in USD
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    occupation: { type: String },
    employer: { type: String },
    message: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Define Models
const Donation = mongoose.model("Donation", donationSchema);
const Currency = mongoose.model('Currency', CurrencySchema);

// ✅ Routes
app.get('/api/currencies', async (req, res) => {
    try {
        const currencies = await Currency.find();
        res.json(currencies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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

app.post("/api/donation", async (req, res) => {
    try {
        const donation = new Donation(req.body);
        await donation.save();
        res.status(201).json({ success: true, donation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// ✅ Start server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
