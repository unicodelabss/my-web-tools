// 1. जरूरी पैकेज इम्पोर्ट करें
const express = require('express');
const multer = require('multer'); // <--- यह लाइन ज़रूरी है
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth'); // पासवर्ड के लिए

const app = express();
const port = 3000;

// =================================================================
// 2. पब्लिक हिस्से (जो सभी के लिए खुले हैं)
// =================================================================

// 'public' फोल्डर को स्टैटिक फाइलों के लिए सर्व करें (होमपेज, आदि)
app.use(express.static('public'));
// 'tools' फोल्डर को भी एक्सेसिबल बनाएं
app.use('/tools', express.static('tools'));

// API Endpoint: जो सभी उपलब्ध टूल्स की लिस्ट देगा (यह पब्लिक रहना चाहिए)
app.get('/api/tools', (req, res) => {
    const toolsDir = path.join(__dirname, 'tools');
    fs.readdir(toolsDir, { withFileTypes: true }, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Tools directory could not be read.' });
        }
        const toolFolders = files
            .filter(dirent => dirent.isDirectory())
            .map(dirent => ({
                name: dirent.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                url: `/tools/${dirent.name}/`
            }));
        res.json(toolFolders);
    });
});


// =================================================================
// 3. सुरक्षित हिस्से (जो सिर्फ एडमिन के लिए हैं)
// =================================================================

// पासवर्ड चेक करने वाला फंक्शन
const adminAuth = basicAuth({
    users: { 'admin': 'password123' }, // <<< अपना यूजरनेम और पासवर्ड यहाँ बदलें
    challenge: true,
    unauthorizedResponse: 'Unauthorized access. Please provide correct credentials.'
});

// ▼▼▼ यह ज़रूरी लाइन यहाँ जोड़ी गई है ▼▼▼
// Multer को फाइल अपलोड के लिए तैयार करना
const upload = multer({ storage: multer.memoryStorage() });
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// एडमिन पैनल का रूट - अब पासवर्ड चेक (adminAuth) सीधे यहीं लगाया गया है
app.get('/admin', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// फाइल अपलोड का रूट - इसे भी सुरक्षित किया गया है
app.post('/upload', adminAuth, upload.single('toolfile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const toolsDir = path.join(__dirname, 'tools');
    
    // ZIP फाइल को हैंडल करना
    if (req.file.mimetype === 'application/zip' || req.file.mimetype === 'application/x-zip-compressed') {
        try {
            const zip = new AdmZip(req.file.buffer);
            zip.extractAllTo(toolsDir, true);
            console.log('ZIP file extracted successfully.');
            res.redirect('/?upload=success');
        } catch (e) {
            console.error("Error extracting ZIP:", e);
            res.status(500).send("Could not extract the ZIP file. It might be corrupted.");
        }
    } 
    // HTML फाइल को हैंडल करना
    else if (req.file.mimetype === 'text/html') {
        const toolName = path.basename(req.file.originalname, '.html');
        const newToolDir = path.join(toolsDir, toolName);
        
        if (!fs.existsSync(newToolDir)) {
            fs.mkdirSync(newToolDir);
        }
        
        fs.writeFileSync(path.join(newToolDir, 'index.html'), req.file.buffer);
        console.log('HTML file saved successfully.');
        res.redirect('/?upload=success');
    } else {
        res.status(400).send('Invalid file type. Please upload a ZIP or HTML file.');
    }
});


// 4. सर्वर शुरू करें
app.listen(port, () => {
    console.log(`Server is running!`);
    console.log(`Homepage is at: http://localhost:${port}`);
    console.log(`Admin Panel is at: http://localhost:${port}/admin`);
});
module.exports = app;