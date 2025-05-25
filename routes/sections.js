const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');

// REST API Routes
router.get('/api/sections', async (req, res) => {
    try {
        const sections = ['beginner', 'intermediate', 'advanced'];
        res.apiSuccess(sections);
    } catch (error) {
        res.apiError(error);
    }
});

router.get('/api/sections/:id', async (req, res) => {
    try {
        const content = await sectionController.getSectionContent(req.params.id, req.user);
        res.apiSuccess(content);
    } catch (error) {
        res.apiError(error);
    }
});

router.get('/api/sections/:id/stats', async (req, res) => {
    try {
        const stats = await sectionController.getSectionStats(req.params.id);
        res.apiSuccess(stats);
    } catch (error) {
        res.apiError(error);
    }
});

// Legacy routes for backward compatibility
router.get('/section/:id', sectionController.getSection);

router.post('/section', (req, res) => {
    req.session.selectedSection = req.body.section;
    res.redirect('/section/' + req.body.section);
});

module.exports = router; 