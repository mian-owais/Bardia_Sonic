const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const gTTS = require('gtts');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/documents';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Mapping from Gemini descriptions to actual audio/effect files
const audioEffectMap = {
    'calm piano music': 'M1.mp3',
    'page turn sound': 'E1a.mp3',
    // Add more mappings as needed
};

// Get all documents for a user
router.get('/', auth, async (req, res) => {
    try {
        const documents = await Document.find({ user: req.user.userId })
            .sort({ createdAt: -1 });
        res.json(documents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching documents' });
    }
});

// Get a single document by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        // Check if the document belongs to the user
        if (document.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        res.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ message: 'Error fetching document' });
    }
});

// Serve PDF file
router.get('/file/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/documents', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
});

// Serve audio file
router.get('/audio/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/audio', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Audio file not found' });
    }

    res.sendFile(filePath);
});

// Upload document
router.post('/upload', upload.single('document'), auth, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const document = new Document({
            user: req.user.userId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/documents/file/${req.file.filename}`,
            metadata: {
                size: req.file.size,
                mimeType: req.file.mimetype
            },
            uploadDate: new Date()
        });

        await document.save();
        res.status(201).json({ documentId: document._id });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ message: 'Error uploading document' });
    }
});

// Process document
router.post('/process/:id', async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        document.status = 'processing';
        await document.save();

        // Optimize PDF parsing
        const dataBuffer = fs.readFileSync(document.filePath);
        const data = await pdfParse(dataBuffer);

        // Extract text and metadata
        document.processedText = data.text;
        document.wordCount = data.text.split(/\s+/).length;
        document.metadata.pages = data.numpages;

        // Create audio directory if it doesn't exist
        const audioDir = path.join(__dirname, '../../uploads/audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        // Generate audio filename
        const audioFilename = `${document._id}.mp3`;
        const audioPath = path.join(audioDir, audioFilename);

        // Convert text to speech using gTTS
        const gtts = new gTTS(document.processedText, 'en');
        await new Promise((resolve, reject) => {
            gtts.save(audioPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Add audio information to document
        document.audioChunks = [{
            filename: audioFilename,
            path: audioPath,
            url: `/api/audio/${audioFilename}`
        }];

        // Update document status and save
        document.status = 'completed';
        await document.save();

        // Return the updated document
        res.json({
            success: true,
            document: {
                ...document.toObject(),
                audioUrl: `/api/audio/${audioFilename}`
            }
        });
    } catch (error) {
        console.error('Error processing document:', error);
        document.status = 'failed';
        document.error = error.message;
        await document.save();
        res.status(500).json({ 
            success: false,
            message: 'Error processing document',
            error: error.message
        });
    }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findByIdAndDelete(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });
        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Error deleting document' });
    }
});

module.exports = router;