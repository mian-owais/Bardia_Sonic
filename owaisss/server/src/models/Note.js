const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    category: {
        type: String,
        enum: ['personal', 'work', 'education', 'other'],
        default: 'personal'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    color: {
        type: String,
        default: '#ffffff'
    },
    attachments: [{
        type: String,
        url: String,
        name: String,
        size: Number,
        mimeType: String
    }],
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['viewer', 'editor'],
            default: 'viewer'
        }
    }],
    versionHistory: [{
        content: String,
        modifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        modifiedAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastModified: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Update lastModified before saving
noteSchema.pre('save', function(next) {
    this.lastModified = Date.now();
    next();
});

module.exports = mongoose.model('Note', noteSchema); 