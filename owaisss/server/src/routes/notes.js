const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// Create new note
router.post('/', auth, async (req, res) => {
    try {
        const note = new Note({
            user: req.user.userId,
            ...req.body
        });

        await note.save();
        res.status(201).json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating note' });
    }
});

// Get all notes
router.get('/', auth, async (req, res) => {
    try {
        const notes = await Note.find({
            $or: [
                { user: req.user.userId },
                { 'collaborators.user': req.user.userId }
            ]
        })
        .sort({ lastModified: -1 });
        
        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching notes' });
    }
});

// Get single note
router.get('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            $or: [
                { user: req.user.userId },
                { 'collaborators.user': req.user.userId }
            ]
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching note' });
    }
});

// Update note
router.put('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            $or: [
                { user: req.user.userId },
                { 'collaborators.user': req.user.userId, 'collaborators.role': 'editor' }
            ]
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Add current version to history
        note.versionHistory.push({
            content: note.content,
            modifiedBy: req.user.userId
        });

        // Update note
        Object.assign(note, req.body);
        await note.save();

        res.json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating note' });
    }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        await note.remove();
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting note' });
    }
});

// Add collaborator
router.post('/:id/collaborators', auth, async (req, res) => {
    try {
        const { userId, role } = req.body;
        const note = await Note.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Check if collaborator already exists
        const existingCollaborator = note.collaborators.find(
            c => c.user.toString() === userId
        );

        if (existingCollaborator) {
            existingCollaborator.role = role;
        } else {
            note.collaborators.push({ user: userId, role });
        }

        await note.save();
        res.json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding collaborator' });
    }
});

// Remove collaborator
router.delete('/:id/collaborators/:userId', auth, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        note.collaborators = note.collaborators.filter(
            c => c.user.toString() !== req.params.userId
        );

        await note.save();
        res.json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error removing collaborator' });
    }
});

// Get note version history
router.get('/:id/history', auth, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            $or: [
                { user: req.user.userId },
                { 'collaborators.user': req.user.userId }
            ]
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.json(note.versionHistory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching version history' });
    }
});

module.exports = router; 