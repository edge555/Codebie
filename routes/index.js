const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

// Index route
router.get('/', indexController.getIndex);

// Home Route
router.get('/home', indexController.getHome);
router.post('/home', indexController.postHome);

module.exports = router; 