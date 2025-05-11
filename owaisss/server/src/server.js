const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables!');
}

// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const audioRoutes = require('./routes/audio');
const notesRoutes = require('./routes/notes');
const subscriptionRoutes = require('./routes/subscription');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // or '*' for all
}));app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 