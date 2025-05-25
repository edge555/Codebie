const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Contact routes
router.get('/contactus', contactController.getContactPage);
router.post('/contactus', contactController.handleContact);

module.exports = router; 