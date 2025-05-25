const express = require('express');
const router = express.Router();
const tutorialController = require('../controllers/tutorialController');
const { ensureAuthenticated } = require('../helpers/auth');
const { adminConfig } = require('../config/app');

// REST API Routes
router.get('/api/tutorials', tutorialController.getTutorialsBySection.bind(tutorialController));

router.get('/api/tutorials/:id', tutorialController.getTutorialByCode.bind(tutorialController));

router.post('/api/tutorials', ensureAuthenticated, async (req, res) => {
    if (!adminConfig.adminIds.includes(req.user.id)) {
        return res.apiForbidden('Access denied');
    }
    await tutorialController.addTutorial(req, res);
});

router.put('/api/tutorials/:id', ensureAuthenticated, async (req, res) => {
    if (!adminConfig.adminIds.includes(req.user.id)) {
        return res.apiForbidden('Access denied');
    }
    await tutorialController.updateTutorial(req, res);
});

router.delete('/api/tutorials/:id', ensureAuthenticated, async (req, res) => {
    if (!adminConfig.adminIds.includes(req.user.id)) {
        return res.apiForbidden('Access denied');
    }
    await tutorialController.deleteTutorial(req, res);
});

// Legacy routes for backward compatibility
router.get('/tutorial/:id', async (req, res) => {
    try {
        const tutorial = await tutorialController.getTutorialByCode(req, res);
        if (!tutorial) {
            req.flash('error_msg', 'Tutorial not found');
            return res.redirect('/');
        }
        res.render('tutorial', {
            user: req.user,
            tutorial
        });
    } catch (error) {
        console.error('Error in tutorial route:', error);
        req.flash('error_msg', 'Error loading tutorial');
        res.redirect('/');
    }
});

// Admin routes
router.get('/add-tutorial', ensureAuthenticated, (req, res) => {
    if (!adminConfig.adminIds.includes(req.user.id)) {
        req.flash('error_msg', 'Access denied');
        return res.redirect('/');
    }
    res.render('add-tutorial', {
        user: req.user
    });
});

router.post('/add-tutorial', ensureAuthenticated, async (req, res) => {
    try {
        if (!adminConfig.adminIds.includes(req.user.id)) {
            req.flash('error_msg', 'Access denied');
            return res.redirect('/');
        }
        await tutorialController.addTutorial(req, res);
        req.flash('success_msg', 'Tutorial added successfully');
        res.redirect('/');
    } catch (error) {
        console.error('Error adding tutorial:', error);
        req.flash('error_msg', 'Error adding tutorial');
        res.redirect('/add-tutorial');
    }
});

router.get('/edit-tutorial/:id', ensureAuthenticated, async (req, res) => {
    try {
        if (!adminConfig.adminIds.includes(req.user.id)) {
            req.flash('error_msg', 'Access denied');
            return res.redirect('/');
        }
        const tutorial = await tutorialController.getTutorialByCode(req, res);
        if (!tutorial) {
            req.flash('error_msg', 'Tutorial not found');
            return res.redirect('/');
        }
        res.render('edit-tutorial', {
            user: req.user,
            tutorial
        });
    } catch (error) {
        console.error('Error loading tutorial:', error);
        req.flash('error_msg', 'Error loading tutorial');
        res.redirect('/');
    }
});

router.post('/edit-tutorial/:id', ensureAuthenticated, async (req, res) => {
    try {
        if (!adminConfig.adminIds.includes(req.user.id)) {
            req.flash('error_msg', 'Access denied');
            return res.redirect('/');
        }
        await tutorialController.updateTutorial(req, res);
        req.flash('success_msg', 'Tutorial updated successfully');
        res.redirect('/');
    } catch (error) {
        console.error('Error updating tutorial:', error);
        req.flash('error_msg', 'Error updating tutorial');
        res.redirect('/edit-tutorial/' + req.params.id);
    }
});

// Tutorial viewing routes
router.get('/tutorials/:id', tutorialController.getTutorial);

module.exports = router; 