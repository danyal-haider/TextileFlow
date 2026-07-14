const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const {
    uploadQcReport,
    reviewQcReport,
    getLatestQcReport
} = require('../controllers/qcController');

router.use(protect);

// Multer Storage Configuration for QC images
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `qc-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.post('/upload-image', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No media file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({ url: fileUrl });
});

router.post('/:orderId/upload', uploadQcReport);
router.put('/:reportId/review', reviewQcReport);
router.get('/:orderId/latest', getLatestQcReport);

module.exports = router;
