const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Mock audio route handlers
router.get('/:filename', (req, res) => {
    res.json({ message: 'Audio file endpoint' });
});

router.delete('/:filename', (req, res) => {
    res.json({ message: 'Audio file deleted' });
});

// Get audio file
router.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/audio', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            success: false,
            message: 'Audio file not found',
            error: 'FILE_NOT_FOUND'
        });
    }

    try {
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error serving audio file:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error serving audio file',
            error: 'SERVER_ERROR'
        });
    }
});

// Delete audio file
router.delete('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/audio', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            success: false,
            message: 'Audio file not found',
            error: 'FILE_NOT_FOUND'
        });
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting audio file:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Error deleting audio file',
                error: 'DELETE_ERROR'
            });
        }
        res.json({ 
            success: true,
            message: 'Audio file deleted successfully'
        });
    });
});

module.exports = router; 