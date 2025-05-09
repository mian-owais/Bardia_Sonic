const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');

// Get user settings
router.get('/', auth, settingsController.getSettings);

// Update user settings
router.put('/', auth, settingsController.updateSettings);

// Update reading goals
router.put('/goals', auth, settingsController.updateReadingGoals);

// Add to reading history
router.post('/history', auth, settingsController.addToReadingHistory);

module.exports = router; 