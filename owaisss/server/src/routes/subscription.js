const express = require('express');
const router = express.Router();

// Mock subscription plans
const PLANS = {
    basic: {
        price: 9.99,
        features: [
            'Up to 10 documents per month',
            'Basic audio effects',
            'Standard processing speed',
            '5GB storage'
        ]
    },
    premium: {
        price: 19.99,
        features: [
            'Unlimited documents',
            'Advanced audio effects',
            'Priority processing',
            '20GB storage',
            'Collaboration features'
        ]
    }
};

// Get subscription plans
router.get('/plans', (req, res) => {
    res.json(PLANS);
});

// Mock subscription creation
router.post('/create-checkout-session', (req, res) => {
    const { plan } = req.body;
    if (!PLANS[plan]) {
        return res.status(400).json({ message: 'Invalid plan' });
    }
    
    // Return a mock success response
    res.json({ 
        message: 'Subscription created successfully',
        plan: plan,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
});

// Mock subscription status
router.get('/status', (req, res) => {
    // Return a mock free plan status
    res.json({
        plan: 'free',
        status: 'active',
        features: [
            'Up to 3 documents per month',
            'Basic audio effects',
            'Standard processing speed',
            '1GB storage'
        ]
    });
});

module.exports = router; 