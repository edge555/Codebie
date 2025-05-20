const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../helpers/auth');
const submissionController = require('../controllers/submissionController');

// View submission by token
router.get('/submission/:id', ensureAuthenticated, async function (req, res) {
    const submission = await submissionController.getSubmissionByToken(req.params.id);
    if (!submission) {
        req.flash('error_msg', 'Submission not found');
        return res.redirect('/home');
    }

    const canSee = submissionController.canViewSubmission(submission, req.user);
    res.render('submission', {
        curuser: req.user,
        submission,
        canSee
    });
});

// View user's submissions
router.get('/submissions/:id', async function (req, res) {
    const submissions = await submissionController.getUserSubmissions(req.params.id);
    res.render('submissions', {
        curuser: req.user,
        user: req.params.id,
        submission: submissions
    });
});

// View recent submissions
router.get('/recent', async function (req, res) {
    const submissions = await submissionController.getRecentSubmissions();
    res.render('recent', {
        curuser: req.user,
        submission: submissions
    });
});

module.exports = router; 