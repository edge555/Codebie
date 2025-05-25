const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureAuthenticated } = require('../helpers/auth');
const authController = require('../controllers/authController');

// Login/Signup Route
router.get('/enter', function (req, res) {
    if (req.user == null) {
        res.render('enter', {
            myid: myid,
            mypass: mypass
        });
    } else {
        res.redirect('home');
    }
});

// Login Post
router.post('/login', function (req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/enter',
        failureFlash: true
    })(req, res, next);
});

// Register post
router.post('/register', authController.register);

// Logout route
router.get('/logout', function (req, res) {
    req.logout();
    req.flash('success_msg', 'Logged Out');
    res.redirect('/');
});

// Troubleshoot routes
router.get('/troubleshoot', authController.getTroubleshoot);
router.post('/troubleshoot', authController.handleTroubleshoot);

// Reset password routes
router.get('/resetpass/:id', authController.getResetPassword);
router.post('/resetpass/:id', authController.handleResetPassword);

module.exports = router; 