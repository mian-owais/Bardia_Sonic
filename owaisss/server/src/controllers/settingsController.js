const UserSettings = require('../models/UserSettings');
const User = require('../models/User');

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ user: req.user.id });
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = new UserSettings({
        user: req.user.id
      });
      await defaultSettings.save();
      return res.json(defaultSettings);
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.user.id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};

// Update reading goals
exports.updateReadingGoals = async (req, res) => {
  try {
    const { targetBooks } = req.body;
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.user.id },
      { $set: { 'readingGoals.targetBooks': targetBooks } },
      { new: true }
    );
    res.json(settings.readingGoals);
  } catch (error) {
    console.error('Error updating reading goals:', error);
    res.status(500).json({ message: 'Error updating reading goals' });
  }
};

// Add book to reading history
exports.addToReadingHistory = async (req, res) => {
  try {
    const { title, rating } = req.body;
    const settings = await UserSettings.findOneAndUpdate(
      { user: req.user.id },
      {
        $push: {
          readingHistory: {
            title,
            lastRead: new Date(),
            rating
          }
        },
        $inc: { 'readingGoals.booksThisMonth': 1 }
      },
      { new: true }
    );
    res.json(settings.readingHistory);
  } catch (error) {
    console.error('Error adding to reading history:', error);
    res.status(500).json({ message: 'Error adding to reading history' });
  }
}; 