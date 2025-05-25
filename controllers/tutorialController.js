const tutorialService = require('../services/tutorialService');
const Tutorial = require('../models/Tutorial');
const logger = require('../helpers/logger');

class TutorialController {
    async getTutorialByCode(req, res) {
        try {
            const tutorial = await tutorialService.getTutorialByCode(req.params.id);
            res.apiSuccess(tutorial);
        } catch (error) {
            if (error.message === 'Tutorial not found') {
                return res.apiNotFound(error.message);
            }
            res.apiError(error);
        }
    }

    async getTutorialsBySection(req, res) {
        try {
            const tutorials = await tutorialService.getTutorialsBySection(req.query.section);
            res.apiSuccess(tutorials);
        } catch (error) {
            res.apiError(error);
        }
    }

    async addTutorial(req, res) {
        try {
            const tutorial = await tutorialService.addTutorial(req.body);
            res.apiSuccess(tutorial, 'Tutorial created successfully');
        } catch (error) {
            if (error.message.includes('required') || error.message.includes('already exists')) {
                return res.apiValidationError(error.message);
            }
            res.apiError(error);
        }
    }

    async updateTutorial(req, res) {
        try {
            const tutorial = await tutorialService.updateTutorial(req.params.id, req.body);
            res.apiSuccess(tutorial, 'Tutorial updated successfully');
        } catch (error) {
            if (error.message === 'Tutorial not found') {
                return res.apiNotFound(error.message);
            }
            if (error.message.includes('required')) {
                return res.apiValidationError(error.message);
            }
            res.apiError(error);
        }
    }

    async deleteTutorial(req, res) {
        try {
            await tutorialService.deleteTutorial(req.params.id);
            res.apiSuccess(null, 'Tutorial deleted successfully');
        } catch (error) {
            if (error.message === 'Tutorial not found') {
                return res.apiNotFound(error.message);
            }
            res.apiError(error);
        }
    }

    async getTutorial(req, res) {
        try {
            const tutorial = await Tutorial.findOne({ code: req.params.id }).lean();
            if (!tutorial) {
                req.flash('error_msg', 'Tutorial not found');
                return res.redirect('/home');
            }

            const tutorials = await Tutorial.find({ section: tutorial.section });
            res.render('tutorial', {
                curuser: req.user,
                curtutorial: tutorial,
                cursectiontutorials: tutorials
            });
        } catch (error) {
            logger.error('Tutorial view error:', error);
            req.flash('error_msg', 'An error occurred while loading the tutorial');
            res.redirect('/home');
        }
    }
}

module.exports = new TutorialController(); 