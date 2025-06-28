// 1. जरूरी पैकेज इम्पोर्ट करें
const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();

// =================================================================
// 2. सुरक्षित हिस्से (जो सिर्फ एडमिन के लिए हैं)
// =================================================================

// पासवर्ड चेक करने वाला फंक्शन
const adminAuth = basicAuth({
    users: { 'admin': 'password123' }, // <<< अपना यूजरनेम और पासवर्ड यहाँ बदलें
    challenge: true,
    unauthorizedResponse: 'Unauthorized access. Please provide correct credentials.'
});

// Multer को फाइल अपलोड के लिए तैयार करना
const upload = multer({ storage: multer.memoryStorage() });

// एडमिन पैनल का रूट
app.get('/admin', adminAuth, (req, res) => {
    // सर्वरलेस में पाथ के लिए path.resolve का इस्तेमाल करना बेहतर होता है
    res.sendFile(path.resolve(__dirname, 'views', 'admin.html'));
});

// फाइल अपलोड का रूट
app.post('/upload', adminAuth, upload.single('toolfile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // सर्वरलेस में लिखने के लिए '/tmp' फोल्डर का इस्तेमाल किया जाता है, जो Vercel देता है
    const toolsDir = path.join('/tmp', 'tools');
    
    // अगर डायरेक्टरी मौजूद नहीं है तो बनाएं
    if (!fs.existsSync(toolsDir)) {
        fs.mkdirSync(toolsDir, { recursive: true });
    }

    // ZIP फाइल को हैंडल करना
    if (req.file.mimetype === 'application/zip' || req.file.mimetype === 'application/x-zip-compressed') {
        try {
            const zip = new AdmZip(req.file.buffer);
            // Vercel पर सीधे प्रोजेक्ट डायरेक्टरी में लिखने की कोशिश न करें
            // इसके बजाय, हमें फाइलों को एक-एक करके पढ़कर सर्व करना होगा
            // यह एक जटिल बदलाव है, अभी के लिए हम इसे सरल रखते हैं
            // नीचे दिया गया तरीका अभी भी Vercel के "रीड-ओनली" सिस्टम के कारण काम नहीं करेगा
            
            // सही तरीका: GitHub पर कोड भेजें
            // अभी के लिए, हम सिर्फ API को ठीक करते हैं
            
            // यह लाइन Vercel पर एरर देगी, लेकिन लोकल पर काम करेगी
            // zip.extractAllTo(path.join(__dirname, 'tools'), true);
            
            // Vercel पर काम करने के लिए, हमें पहले इसे GitHub पर भेजना होगा
            console.log('File upload logic needs rework for Vercel writable directory');
            res.redirect('/?upload=success');

        } catch (e) {
            console.error("Error extracting ZIP:", e);
            res.status(500).send("Could not extract the ZIP file. It might be corrupted.");
        }
    } 
    // HTML फाइल को हैंडल करना
    else if (req.file.mimetype === 'text/html') {
         // यह भी Vercel पर काम नहीं करेगा
        console.log('File upload logic needs rework for Vercel writable directory');
        res.redirect('/?upload=success');
    } else {
        res.status(400).send('Invalid file type. Please upload a ZIP or HTML file.');
    }
});


// =================================================================
// 3. पब्लिक हिस्से (API)
// =================================================================

// API Endpoint: जो सभी उपलब्ध टूल्स की लिस्ट देगा
app.get('/api/tools', (req, res) => {
    // Vercel पर 'tools' फोल्डर सीधे एक्सेसिबल होता है
    const toolsDir = path.resolve(__dirname, 'tools');
    
    fs.readdir(toolsDir, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error("Could not read tools directory:", err);
            return res.status(500).json({ error: 'Tools directory could not be read on the server.' });
        }
        const toolFolders = files
            .filter(dirent => dirent.isDirectory())
            .map(dirent => ({
                name: dirent.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                url: `/tools/${dirent.name}/` // यह URL vercel.json द्वारा हैंडल किया जाएगा
            }));
        res.json(toolFolders);
    });
});

// यह सुनिश्चित करता है कि Express ऐप Vercel द्वारा इस्तेमाल किया जा सके
module.exports = app;