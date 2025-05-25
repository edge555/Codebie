const express = require('express');
const router = express.Router();
const staticController = require('../controllers/staticController');

// About us
router.get('/aboutus', staticController.getAboutUs);

// Error Route 
router.get('/error', staticController.getError);

// FAQ Route 
router.get('/faq', staticController.getFaq);

// Private policy route
router.get('/privatepolicy', staticController.getPrivatePolicy);

module.exports = router; 