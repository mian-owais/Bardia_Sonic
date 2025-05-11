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
    console.log('[PDF SERVE] Attempting to serve file:', filePath); // Debug log
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
});

// Get audio chunks for a document
router.get('/audio/:documentId/chunks', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!document.audioChunks || document.audioChunks.length === 0) {
            return res.status(404).json({ message: 'No audio chunks found for this document' });
        }

        // Return chunk metadata
        const chunks = document.audioChunks.map(chunk => ({
            url: chunk.url,
            filename: chunk.filename,
            index: parseInt(chunk.filename.split('_').pop().split('.')[0])
        })).sort((a, b) => a.index - b.index);

        res.json(chunks);
    } catch (error) {
        console.error('Error fetching audio chunks:', error);
        res.status(500).json({ message: 'Error fetching audio chunks' });
    }
});

// Serve audio file
router.get('/audio/:filename', auth, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/audio', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Audio file not found' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
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

        // Optimize PDF parsing with chunking
        const dataBuffer = fs.readFileSync(document.filePath);
        const data = await pdfParse(dataBuffer);

        // Split text into chunks of approximately 1000 words for parallel processing
        const textChunks = data.text.split(/\s+/).reduce((chunks, word, index) => {
            const chunkIndex = Math.floor(index / 1000);
            if (!chunks[chunkIndex]) chunks[chunkIndex] = [];
            chunks[chunkIndex].push(word);
            return chunks;
        }, []).map(chunk => chunk.join(' '));

        // Create audio directory if it doesn't exist
        const audioDir = path.join(__dirname, '../../uploads/audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        // Process chunks in parallel with a concurrency limit
        const concurrencyLimit = 3;
        const audioChunks = [];
        const processingPromises = [];

        for (let i = 0; i < textChunks.length; i += concurrencyLimit) {
            const chunkPromises = textChunks.slice(i, i + concurrencyLimit).map(async (chunk, index) => {
                const chunkIndex = i + index;
                const audioFilename = `${document._id}_chunk_${chunkIndex}.mp3`;
        const audioPath = path.join(audioDir, audioFilename);

                // Check if chunk audio already exists in cache
                if (fs.existsSync(audioPath)) {
                    return {
                        filename: audioFilename,
                        path: audioPath,
                        url: `/api/audio/${audioFilename}`
                    };
                }

                // Convert chunk to speech
                const gtts = new gTTS(chunk, 'en');
        await new Promise((resolve, reject) => {
            gtts.save(audioPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

                return {
            filename: audioFilename,
            path: audioPath,
            url: `/api/audio/${audioFilename}`
                };
            });

            const chunkResults = await Promise.all(chunkPromises);
            audioChunks.push(...chunkResults);
        }

        // Update document with processed information
        document.processedText = data.text;
        document.wordCount = data.text.split(/\s+/).length;
        document.metadata.pages = data.numpages;
        document.audioChunks = audioChunks;
        document.status = 'completed';
        document.processingTime = Date.now() - document.createdAt;

        await document.save();

        // Return the updated document
        res.json({
            success: true,
            document: {
                ...document.toObject(),
                audioUrl: `/api/audio/${document._id}_chunk_0.mp3` // First chunk as default
            }
        });
    } catch (error) {
        console.error('Error processing document:', error);
        document.status = 'failed';
        document.error = error.message;
        await document.save();
        res.status(500).json({ message: 'Error processing document', error: error.message });
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