const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../helpers/auth');
const userController = require('../controllers/userController');

// Profile routes
router.get('/profile/:id', userController.getProfile);
router.get('/editprofile/:id', ensureAuthenticated, (req, res) => {
    if (req.params.id !== req.user.username) {
        req.flash('error_msg', 'You cannot edit this profile');
        return res.redirect('/home');
    }
    res.render('editprofile', {
        curuser: req.user,
        errors: [],
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg')
    });
});
router.post('/editprofile/:id', ensureAuthenticated, userController.editProfile);

// Submissions routes
router.get('/submissions/:id', userController.getSubmissions);

// Ranklist route
router.get('/ranklist', userController.getRanklist);

module.exports = router; 