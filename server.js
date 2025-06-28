const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const port = 3000;

// --- Static Files ---
// यह Vercel और लोकल दोनों पर काम करेगा
app.use(express.static(path.join(__dirname, 'public')));
app.use('/tools', express.static(path.join(__dirname, 'tools')));

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Password Protection ---
const adminAuth = basicAuth({
    users: { 'admin': 'password123' }, // अपना पासवर्ड यहाँ बदलें
    challenge: true
});

// --- Routes ---

// Admin Panel Route (Protected)
app.get('/admin', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// API Route to get data (Public)
app.get('/api/data', (req, res) => {
    try {
        const data = require('./tools-data.json');
        data.tools.sort((a, b) => (a.order || 999) - (b.order || 999));
        res.status(200).json(data);
    } catch (error) {
        console.error("Error loading data.json:", error);
        res.status(500).json({ error: "Could not load data." });
    }
});

// Note: The /upload and other POST/DELETE routes are part of a local workflow
// and are not required for the Vercel deployment to serve the site.
// They can be added back inside an "if (process.env.NODE_ENV !== 'production')" block
// if you want to use the local admin panel to modify files.

// --- Start server for local development ---
// This part will be ignored by Vercel
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`✅ Local server running at http://localhost:${port}`);
    });
}

// Export the app for Vercel
module.exports = app;