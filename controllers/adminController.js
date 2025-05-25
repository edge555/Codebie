const Problem = require('../models/Problem');
const Tutorial = require('../models/Tutorial');
const logger = require('../helpers/logger');
const { getBDTime } = require('../helpers/utils');
const { adminConfig } = require('../config/app');

class AdminController {
    async getAdminPanel(req, res) {
        try {
            if (!adminConfig.development.adminIds.includes(req.user.username)) {
                return res.render('accessdenied');
            }
            res.render('admin/admin');
        } catch (error) {
            logger.error('Admin panel error:', error);
            req.flash('error_msg', 'An error occurred while loading the admin panel');
            res.redirect('/home');
        }
    }

    async handleAdminAction(req, res) {
        try {
            if (!adminConfig.development.adminIds.includes(req.user.username)) {
                return res.render('accessdenied');
            }

            switch (req.body.submit) {
                case "addproblem":
                    return res.redirect('admin/addproblem');
                case "editproblem":
                    req.session.cureditproblem = req.body.problemname;
                    return res.redirect('admin/editproblem');
                case "deleteproblem":
                    await Problem.deleteOne({ code: req.body.problemname });
                    return res.redirect('/admin');
                case "addtutorial":
                    return res.redirect('admin/addtutorial');
                case "edittutorial":
                    req.session.curedittutorial = req.body.tutorialname;
                    return res.redirect('admin/edittutorial');
                case "deletetutorial":
                    await Tutorial.deleteOne({ code: req.body.tutorialname });
                    return res.redirect('/admin');
                default:
                    req.flash('error_msg', 'Invalid action');
                    return res.redirect('/admin');
            }
        } catch (error) {
            logger.error('Admin action error:', error);
            req.flash('error_msg', 'An error occurred while processing your request');
            res.redirect('/admin');
        }
    }

    async getAddProblem(req, res) {
        try {
            if (!adminConfig.development.adminIds.includes(req.user.username)) {
                return res.render('accessdenied');
            }
            res.render('admin/addproblem');
        } catch (error) {
            logger.error('Add problem page error:', error);
            req.flash('error_msg', 'An error occurred while loading the page');
            res.redirect('/admin');
        }
    }

    async addProblem(req, res) {
        try {
            if (!adminConfig.development.adminIds.includes(req.user.username)) {
                return res.render('accessdenied');
            }

            const testcasecount = req.body.testcasecount;
            const inputs = [], outputs = [];
            
            for (let i = 0; i < testcasecount; i++) {
                inputs.push(eval(`req.body.input${i}`));
                outputs.push(eval(`req.body.output${i}`));
            }

            const newProblem = {
                name: req.body.name,
                code: req.body.code,
                difficulty: req.body.difficulty,
                statement: req.body.statement,
                inputformat: req.body.inputformat,
                constraints: req.body.constraints,
                outputformat: req.body.outputformat,
                timelimit: req.body.timelimit,
                testcasecount: req.body.testcasecount,
                samplecount: req.body.samplecount,
                inputs: inputs,
                outputs: outputs,
                section: req.body.section,
                tags: req.body.tags,
                solvecount: 0,
                dateAdded: getBDTime()
            };

            await new Problem(newProblem).save();
            res.redirect('/admin');
        } catch (error) {
            logger.error('Add problem error:', error);
            req.flash('error_msg', 'An error occurred while adding the problem');
            res.redirect('/admin/addproblem');
        }
    }

    async getEditProblem(req, res) {
        try {
            if (!adminConfig.development.adminIds.includes(req.user.username)) {
                return res.render('accessdenied');
            }

            const problem = await Problem.findOne({ code: req.session.cureditproblem }).lean();
            res.render('admin/editproblem', {
                cureditproblem: problem
            });
        } catch (error) {
            logger.error('Edit problem page error:', error);
            req.flash('error_msg', 'An error occurred while loading the page');
            res.redirect('/admin');
        }
    }

    async editProblem(req, res) {
        try {
            if (!adminConfig.development.adminIds.includes(req.user.username)) {
                return res.render('accessdenied');
            }

            const problem = await Problem.findOne({ code: req.session.cureditproblem });
            if (!problem) {
                req.flash('error_msg', 'Problem not found');
                return res.redirect('/admin');
            }

            const testcasecount = req.body.testcasecount;
            const inputs = [], outputs = [];
            
            for (let i = 0; i < testcasecount; i++) {
                inputs.push(eval(`req.body.input${i}`));
                outputs.push(eval(`req.body.output${i}`));
            }

            Object.assign(problem, {
                name: req.body.name,
                code: req.body.code,
                difficulty: req.body.difficulty,
                statement: req.body.statement,
                inputformat: req.body.inputformat,
                constraints: req.body.constraints,
                outputformat: req.body.outputformat,
                timelimit: req.body.timelimit,
                testcasecount: req.body.testcasecount,
                samplecount: req.body.samplecount,
                inputs: inputs,
                outputs: outputs,
                section: req.body.section,
                tags: req.body.tags,
                solvecount: req.body.solvecount
            });

            await problem.save();
            res.redirect('/admin');
        } catch (error) {
            logger.error('Edit problem error:', error);
            req.flash('error_msg', 'An error occurred while editing the problem');
            res.redirect('/admin/editproblem');
        }
    }

    async getAddTutorial(req, res) {
        try {
            if (!adminConfig.development.adminIds.includes(req.user.username)) {
                return res.render('accessdenied');
            }
            res.render('admin/addtutorial');
        } catch (error) {
            logger.error('Add tutorial page error:', error);
            req.flash('error_msg', 'An error occurred while loading the page');
            res.redirect('/admin');
        }
    }

    async addTutorial(req, res) {
        try {
            if (!adminConfig.development.adminIds.includes(req.user.username)) {
                return res.render('accessdenied');
            }

            const newTutorial = {
                name: req.body.name,
                code: req.body.code,
                statement: req.body.statement,
                section: req.body.section
            };

            await new Tutorial(newTutorial).save();
            res.redirect('/admin');
        } catch (error) {
            logger.error('Add tutorial error:', error);
            req.flash('error_msg', 'An error occurred while adding the tutorial');
            res.redirect('/admin/addtutorial');
        }
    }

    async getEditTutorial(req, res) {
        try {
            if (!adminConfig.development.adminIds.includes(req.user.username)) {
                return res.render('accessdenied');
            }

            const tutorial = await Tutorial.findOne({ code: req.session.curedittutorial });
            res.render('admin/edittutorial', {
                curedittutorial: tutorial
            });
        } catch (error) {
            logger.error('Edit tutorial page error:', error);
            req.flash('error_msg', 'An error occurred while loading the page');
            res.redirect('/admin');
        }
    }

    async editTutorial(req, res) {
        try {
            if (!adminConfig.development.adminIds.includes(req.user.username)) {
                return res.render('accessdenied');
            }

            const tutorial = await Tutorial.findOne({ code: req.session.curedittutorial });
            if (!tutorial) {
                req.flash('error_msg', 'Tutorial not found');
                return res.redirect('/admin');
            }

            Object.assign(tutorial, {
                name: req.body.name,
                code: req.body.code,
                statement: req.body.statement,
                section: req.body.section
            });

            await tutorial.save();
            res.redirect('/admin');
        } catch (error) {
            logger.error('Edit tutorial error:', error);
            req.flash('error_msg', 'An error occurred while editing the tutorial');
            res.redirect('/admin/edittutorial');
        }
    }
}

module.exports = new AdminController(); 