import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
(async () => {
    try {
        await mongoose.connect(process.env.uri);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB", error);
    }
})();

// ✅ Schemas + Models
const NetworkSchema = new mongoose.Schema({
    key: String,
    label: String,
    icon: String,
    address: String,
    qr: String,
});

const CurrencySchema = new mongoose.Schema({
    coin: String,
    name: String,
    icon: String,
    networks: [NetworkSchema],
});

const donationSchema = new mongoose.Schema({
    coin: { type: String, required: true },
    network: { type: String, required: true },
    address: { type: String, required: true },
    amountUSD: { type: Number, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    occupation: String,
    employer: String,
    message: String,
    createdAt: { type: Date, default: Date.now },
});

const Donation = mongoose.model("Donation", donationSchema);
const Currency = mongoose.model("Currency", CurrencySchema);

// ✅ Routes
app.get("/api/currencies", async (req, res) => {
    try {
        const currencies = await Currency.find();
        res.json(currencies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/donation", async (req, res) => {
    try {
        const donation = new Donation(req.body);
        await donation.save();
        res.status(201).json({ success: true, donation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/api/send-email", async (req, res) => {
    try {
        const { candidateName, recipientName, recipientEmail, senderName } = req.body;

        if (!candidateName || !recipientName || !recipientEmail || !senderName) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // load the template from .env
        const variables = {
            candidateName,
            recipientName,
            senderName,
            donateUrl: process.env.DONATE_URL
        };

        let emailHtml = fillTemplate(process.env.EMAIL_TEMPLATE, variables);
        let emailSubject = fillTemplate(process.env.EMAIL_SUBJECT, variables);

        const data = await resend.emails.send({
            from: `Fairshake PAC <donations@deepseachain.online>`,
            to: recipientEmail,
            subject: emailSubject,
            html: emailHtml
        });

        res.json({ message: "Email request sent successfully", data });
    } catch (error) {
        res.status(500).json({ message: "Error sending email", error: error.message });
    }
});

function fillTemplate(template, variables) {
    return Object.entries(variables).reduce(
        (str, [key, value]) => str.replace(new RegExp(`{{${key}}}`, "g"), value),
        template
    );
}


// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
