const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();

// JSON डेटा को पढ़ने के लिए Middleware
app.use(express.json());

// --- पासवर्ड सुरक्षा ---
const adminAuth = basicAuth({
    users: { 'admin': 'password123' }, // अपना पासवर्ड यहाँ बदलें
    challenge: true
});

// ध्यान दें: अब हम एडमिन पेज या फाइल अपलोड को यहाँ हैंडल नहीं कर रहे हैं।
// Vercel.json उन्हें सीधे हैंडल करेगा या ब्लॉक करेगा।
// हमारा सर्वर अब सिर्फ डेटा API के लिए है।

// --- API Endpoints ---
app.get('/api/data', (req, res) => {
    try {
        // हम JSON फाइल को सीधे इम्पोर्ट करेंगे, यह सर्वरलेस में ज़्यादा विश्वसनीय है।
        const data = require('./tools-data.json');
        
        // टूल्स को ऑर्डर के हिसाब से सॉर्ट करें
        data.tools.sort((a, b) => (a.order || 999) - (b.order || 999));
        
        res.status(200).json(data);
    } catch (error) {
        console.error("Error reading or parsing tools-data.json:", error);
        res.status(500).json({ error: "Could not load data." });
    }
});

// टूल की जानकारी को अपडेट करने के लिए API
app.post('/api/tools/update-all', adminAuth, (req, res) => {
    const { tools } = req.body;
    if (!Array.isArray(tools)) {
        return res.status(400).json({ success: false, message: 'Invalid data format.' });
    }
    
    const dataFilePath = path.join('/tmp', 'tools-data.json');
    const currentData = require('./tools-data.json');
    currentData.tools = tools;
    
    // Vercel पर लिखने के लिए /tmp फोल्डर का इस्तेमाल होता है,
    // लेकिन यह डिप्लॉयमेंट का हिस्सा नहीं बनता।
    // इसका मतलब है कि यह तरीका भी लाइव डेटा को स्थायी रूप से नहीं बदलेगा।
    // सही तरीका हमेशा Git Workflow ही है।
    // fs.writeFileSync(dataFilePath, JSON.stringify(currentData, null, 2));
    
    console.log("Data update requested. Remember to commit changes to git for persistence.");
    res.json({ success: true, message: 'Update request received. Commit tools-data.json to save changes permanently.' });
});


// यह Vercel के लिए ऐप को एक्सपोर्ट करता है
module.exports = app;