const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  readingSpeed: {
    type: Number,
    default: 250
  },
  preferredLanguage: {
    type: String,
    default: 'en'
  },
  notificationPreferences: {
    type: String,
    enum: ['all', 'important', 'none'],
    default: 'all'
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'light'
  },
  favoriteBooks: [{
    title: String,
    author: String,
    genre: String
  }],
  readingGoals: {
    booksThisMonth: {
      type: Number,
      default: 0
    },
    targetBooks: {
      type: Number,
      default: 5
    },
    readingStreak: {
      type: Number,
      default: 0
    }
  },
  readingHistory: [{
    title: String,
    lastRead: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('UserSettings', userSettingsSchema); 