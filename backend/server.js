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


const currencies = [
  {
    coin: 'btc',
    name: 'Bitcoin',
    icon: 'btc-icon.png',
    networks: [
      {
        key: 'mainnet',
        label: 'Mainnet',
        icon: 'mainnet-icon.png',
        address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        qr: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=bitcoin:1BoatSLRHtKNngkdXEeobR76b53LETtpyT'
      }
    ]
  },
  {
    coin: 'eth',
    name: 'Ethereum',
    icon: 'eth-icon.png',
    networks: [
      {
        key: 'erc20',
        label: 'ERC20 - Mainnet',
        icon: 'erc20-icon.png',
        address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        qr: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ethereum:0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
      }
    ]
  },
  {
    coin: 'usdc',
    name: 'USD Coin',
    icon: 'usdc-icon.png',
    networks: [
      {
        key: 'erc20',
        label: 'Ethereum (ERC20)',
        icon: 'erc20-icon.png',
        address: '0x111111111117dC0aa78b770fA6A738034120C302',
        qr: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=usdc:erc20:0x111111111117dC0aa78b770fA6A738034120C302'
      },
      {
        key: 'solana',
        label: 'Solana',
        icon: 'solana-icon.png',
        address: '9xQeWvG816bUx9EPjHmaT9NwGyShtdD5mF7mD5PsnkFQ',
        qr: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=usdc:solana:9xQeWvG816bUx9EPjHmaT9NwGyShtdD5mF7mD5PsnkFQ'
      }
    ]
  },
  {
    coin: 'usdt',
    name: 'Tether',
    icon: 'usdt-icon.png',
    networks: [
      {
        key: 'erc20',
        label: 'ERC20',
        icon: 'erc20-icon.png',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        qr: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=usdt:erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7'
      }
    ]
  },
  {
    coin: 'ltc',
    name: 'Litecoin',
    icon: 'ltc-icon.png',
    networks: [
      {
        key: 'mainnet',
        label: 'Mainnet',
        icon: 'mainnet-icon.png',
        address: 'LcHKuwFZXyp5pTDL5wQHzpiapQDPZwsC5V',
        qr: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=litecoin:LcHKuwFZXyp5pTDL5wQHzpiapQDPZwsC5V'
      }
    ]
  },
  {
    coin: 'xrp',
    name: 'XRP',
    icon: 'xrp-icon.png',
    networks: [
      {
        key: 'mainnet',
        label: 'Mainnet',
        icon: 'mainnet-icon.png',
        address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
        qr: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=xrp:rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh'
      }
    ]
  },
  {
    coin: 'trx',
    name: 'Tron',
    icon: 'trx-icon.png',
    networks: [
      {
        key: 'trc20',
        label: 'TRC20',
        icon: 'trc20-icon.png',
        address: 'TQm8kxzZjQihjM4cnSbVgkP9Nwqx6RpQ3h',
        qr: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=trx:TQm8kxzZjQihjM4cnSbVgkP9Nwqx6RpQ3h'
      }
    ]
  },
  {
    coin: 'doge',
    name: 'Dogecoin',
    icon: 'doge-icon.png',
    networks: [
      {
        key: 'mainnet',
        label: 'Mainnet',
        icon: 'mainnet-icon.png',
        address: 'D8B4yJrZ9gH9c3yDd1HmbvH9uCnZbkkj5h',
        qr: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=dogecoin:D8B4yJrZ9gH9c3yDd1HmbvH9uCnZbkkj5h'
      }
    ]
  }
];


// // ✅ Seeder function (only run once!)
// async function seedCurrencies() {
//     try {
//         const count = await Currency.countDocuments();
//         if (count === 0) {
//             await Currency.insertMany(currencies);
//             console.log('🌱 Seeded currencies collection');
//         } else {
//             console.log('⚠️ Currencies already exist, skipping seed');
//         }
//     } catch (err) {
//         console.error('Error seeding currencies:', err);
//     }
// }
// seedCurrencies();

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

// ✅ Start server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
