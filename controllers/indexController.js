const User = require('../models/User');
const Submission = require('../models/Submission');
const getCounter = require('../helpers/counter');

class IndexController {
    async getIndex(req, res) {
        try {
            if (req.user) {
                return res.redirect('/home');
            }

            // Get user and submission counts
            const userCount = await User.estimatedDocumentCount();
            const submissionCount = await Submission.estimatedDocumentCount();

            res.render('index', {
                error_msg: req.flash('error_msg'),
                success_msg: req.flash('success_msg'),
                userCount,
                submissionCount
            });
        } catch (error) {
            console.error('Index page error:', error);
            res.render('index', {
                error_msg: 'An error occurred while loading the page',
                userCount: 0,
                submissionCount: 0
            });
        }
    }

    // Home Route
    async getHome(req, res) {
        try {
            const counter = await new Promise((resolve) => {
                getCounter(resolve);
            });

            res.render('home', {
                curuser: req.user,
                counter: counter
            });
        } catch (error) {
            console.error('Error in home route:', error);
            req.flash('error_msg', 'An error occurred while loading the home page');
            res.redirect('/');
        }
    }

    postHome(req, res) {
        req.session.section = req.body.submit;
        res.redirect('/section/' + req.session.section);
    }
}

module.exports = new IndexController(); 