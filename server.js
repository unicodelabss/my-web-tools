const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const port = 3000;

// --- Static Files ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/tools', express.static(path.join(__dirname, 'tools')));

// --- Middlewares ---
app.use(express.json());

// --- Password Protection ---
const adminAuth = basicAuth({
    users: { 'admin': 'password122' }, // अपना पासवर्ड यहाँ बदलें
    challenge: true
});

// --- Routes ---

// Admin Panel Route (Protected)
app.get('/admin', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// API Route to get data (Public) - WITH DEBUGGING
app.get('/api/data', (req, res) => {
    try {
        // हम fs.readFileSync का इस्तेमाल करेंगे, यह ज़्यादा स्पष्ट है
        const dataPath = path.join(__dirname, 'tools-data.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData); // अगर JSON में गलती है, तो एरर यहीं आएगा

        data.tools.sort((a, b) => (a.order || 999) - (b.order || 999));
        res.status(200).json(data);
    } catch (error) {
        // ▼▼▼ यह सबसे ज़रूरी बदलाव है ▼▼▼
        // हम असली एरर को कंसोल में भी दिखाएंगे और फ्रंटएंड को भी भेजेंगे
        console.error("SERVER-SIDE ERROR in /api/data:", error);
        res.status(500).json({ 
            error: "Could not load data from server.",
            // हम एरर का मैसेज भी भेज रहे हैं
            details: error.message 
        });
    }
});

// --- Start server for local development ---
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`✅ Local server running at http://localhost:${port}`);
    });
}

// Export the app for Vercel
module.exports = app;