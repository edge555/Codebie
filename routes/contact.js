const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Show contact page
router.get('/contactus', function (req, res) {
    res.render('contactus', {
        curuser: req.user
    });
});

// Handle contact form submission
router.post('/contactus', async function (req, res) {
    const result = await contactController.sendContactEmail(req.body);
    
    if (result.success) {
        req.flash('success_msg', 'Message sent successfully! We will get back to you soon.');
    } else {
        req.flash('error_msg', result.error || 'Failed to send message. Please try again.');
    }
    
    res.redirect('/contactus');
});

module.exports = router; 