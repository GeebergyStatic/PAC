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

const contactedEmailSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    contactedAt: { type: Date, default: Date.now }
});

const Donation = mongoose.model("Donation", donationSchema);
const Currency = mongoose.model("Currency", CurrencySchema);
const ContactedEmail = mongoose.model("ContactedEmail", contactedEmailSchema);

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
        const { context, candidateName, recipientName, recipientEmail, senderName, sendAgain, preventRepeat } = req.body;

        // context must exist
        if (!context || !recipientName || !recipientEmail || !senderName) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // candidateName required only for mass
        if (context === "mass" && !candidateName) {
            return res.status(400).json({ message: "Candidate name is required for mass emails" });
        }

        // recipientEmail is expected to be an array
        if (!Array.isArray(recipientEmail)) {
            return res.status(400).json({ message: "recipientEmail must be an array" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Filter valid emails
        let emails = recipientEmail.filter(e => emailRegex.test(e));
        if (emails.length === 0) {
            return res.status(400).json({ message: "No valid email addresses provided" });
        }

        // Prevent repeats if checkbox is set
        if (preventRepeat) {
            const alreadyContacted = await ContactedEmail.find({ email: { $in: emails } }).lean();
            const alreadySet = new Set(alreadyContacted.map(e => e.email));

            emails = emails.filter(e => !alreadySet.has(e));
        }

        if (emails.length === 0) {
            return res.status(200).json({ message: "No new recipients (all previously contacted)" });
        }

        // template variables
        const variables = {
            candidateName,
            recipientName,
            senderName,
            donateUrl: process.env.DONATE_URL
        };

        // choose correct template based on context
        let emailHtml, emailSubject;
        if (context === "targeted") {
            emailHtml = fillTemplate(process.env.TARGETED_EMAIL_TEMPLATE, variables);
            emailSubject = fillTemplate(process.env.TARGETED_EMAIL_SUBJECT, variables);
        }
        else if (context === "trumpDonation") {
            emailHtml = fillTemplate(process.env.TRUMP_DONATION_EMAIL_TEMPLATE, variables);
            emailSubject = fillTemplate(process.env.TRUMP_DONATION_EMAIL_SUBJECT, variables);
        } else {
            emailHtml = fillTemplate(process.env.EMAIL_TEMPLATE, variables);
            emailSubject = fillTemplate(process.env.EMAIL_SUBJECT, variables);
        }

        // Send emails
        const results = [];
        for (const email of emails) {
            try {
                const data = await resend.emails.send({
                    from: `Fairshake PAC <donations@fairshakepac.info>`,
                    to: email,
                    subject: emailSubject,
                    html: emailHtml
                });
                results.push({ email, status: "sent", data });

                // Save email to DB
                await ContactedEmail.updateOne(
                    { email },
                    { $set: { contactedAt: new Date() } },
                    { upsert: true }
                );

                // Resend if checkbox ticked
                if (sendAgain) {
                    setTimeout(async () => {
                        try {
                            await resend.emails.send({
                                from: `Fairshake PAC <donations@fairshakepac.info>`,
                                to: email,
                                subject: emailSubject,
                                html: emailHtml
                            });
                            console.log(`Follow-up email sent to ${email}`);
                        } catch (err) {
                            console.error("Error sending follow-up email:", err.message);
                        }
                    }, 60 * 1000);
                }

            } catch (err) {
                results.push({ email, status: "error", error: err.message });
            }
        }

        res.json({ message: "Processing complete", results });
    } catch (error) {
        console.error("Error in /api/send-email:", error);
        res.status(500).json({ message: "Error sending email", error: error.message });
    }
});



function fillTemplate(template, variables) {
    return Object.entries(variables).reduce(
        (str, [key, value]) => str.replace(new RegExp(`{{${key}}}`, "g"), value),
        template
    );
}

app.post("/api/check-password", (req, res) => {
    try {
        const { password } = req.body;

        // Check if password field is missing
        if (!password) {
            return res.status(400).json({
                valid: false,
                error: "Password is required."
            });
        }

        // Check if environment variable is set
        if (!process.env.PAGE_PASSWORD) {
            console.error("PAGE_PASSWORD is not set in environment variables.");
            return res.status(500).json({
                valid: false,
                error: "Server configuration error."
            });
        }

        // Validate password
        if (password === process.env.PAGE_PASSWORD) {
            return res.json({ valid: true });
        } else {
            return res.status(401).json({
                valid: false,
                error: "Invalid password."
            });
        }
    } catch (err) {
        console.error("Error in /api/check-password:", err.message);
        return res.status(500).json({
            valid: false,
            error: "Internal server error."
        });
    }
});




// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
