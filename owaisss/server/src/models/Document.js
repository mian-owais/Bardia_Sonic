const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
    type: { type: String, required: true },
    startTime: { type: Number, required: true, min: 0 },
    endTime: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
}, { _id: false });

// Custom validation: endTime > startTime
musicSchema.path('endTime').validate(function(value) {
    return value > this.startTime;
}, 'endTime must be greater than startTime');

const effectSchema = new mongoose.Schema({
    type: { type: String, required: true },
    timestamp: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
}, { _id: false });

const documentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['uploaded', 'processing', 'completed', 'failed'],
        default: 'uploaded'
    },
    error: {
        type: String
    },
    processedText: {
        type: String
    },
    audioChunks: [{
        filename: String,
        path: String,
        url: String
    }],
    musicTimeline: {
        music: [musicSchema],
        effects: [effectSchema]
    },
    processingTime: {
        type: Number
    },
    wordCount: {
        type: Number
    },
    metadata: {
        pages: Number,
        size: Number,
        mimeType: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
documentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema); 