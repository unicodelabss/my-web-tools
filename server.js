const express = require('express');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const port = 3000;

// यह Vercel पर ज़रूरी नहीं है, लेकिन लोकल के लिए अच्छा है
app.use(express.static(path.join(__dirname, 'public')));
app.use('/tools', express.static(path.join(__dirname, 'tools')));

// पासवर्ड सुरक्षा
const adminAuth = basicAuth({
    users: { 'admin': 'password123' }, // अपना पासवर्ड यहाँ बदलें
    challenge: true
});

// एडमिन पेज का रास्ता
app.get('/admin', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// API का रास्ता
app.get('/api/data', (req, res) => {
    try {
        // हम require का इस्तेमाल करेंगे, यह सर्वरलेस में सबसे विश्वसनीय है
        const data = require('./tools-data.json');
        data.tools.sort((a, b) => (a.order || 999) - (b.order || 999));
        res.status(200).json(data);
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Could not load tool data." });
    }
});

// लोकल डेवलपमेंट के लिए सर्वर चलाना
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`✅ Local server running at http://localhost:${port}`);
    });
}

// Vercel के लिए ऐप को एक्सपोर्ट करना
module.exports = app;