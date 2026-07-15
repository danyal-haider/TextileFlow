const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const { getChatHistory } = require('../controllers/chatController');

router.use(protect);

// Multer Storage Configuration
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Retrieve message logs
router.get('/:orderId', getChatHistory);

// Upload single message attachment
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No attachment file uploaded' });
    }

    // Determine host URL
    const host = req.get('host');
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    
    res.status(200).json({
        url: fileUrl,
        name: req.file.originalname,
        mimeType: req.file.mimetype
    });
});

module.exports = router;
