const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Token = require('../models/Token');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const logger = require('../helpers/logger');
const { getBDTime } = require('../helpers/utils');
const mailService = require('../helpers/mailService');
const getCounter = require('../helpers/counter');

class UserController {
    async getProfile(req, res) {
        try {
            const counter = await new Promise((resolve) => {
                getCounter(resolve);
            });

            const user = await User.findOne({ username: req.params.id });
            if (!user) {
                req.flash('error_msg', 'User not found');
                return res.redirect('/home');
            }

            // Organize solved problems by section
            const solvedProblems = {
                c: [],
                cpp: [],
                java: [],
                py: [],
                ds: [],
                algo: []
            };

            user.solved.forEach(solve => {
                if (solvedProblems[solve.section]) {
                    solvedProblems[solve.section].push(solve.code);
                }
            });

            res.render('profile', {
                user: user,
                curuser: req.user,
                counter: counter,
                profileCSolve: solvedProblems.c,
                profileCppSolve: solvedProblems.cpp,
                profileJavaSolve: solvedProblems.java,
                profilePySolve: solvedProblems.py,
                profileDsSolve: solvedProblems.ds,
                profileAlgoSolve: solvedProblems.algo,
                id: req.params.id
            });
        } catch (error) {
            logger.error('Profile view error:', error);
            req.flash('error_msg', 'An error occurred while loading the profile');
            res.redirect('/home');
        }
    }

    async editProfile(req, res) {
        try {
            if (req.params.id !== req.user.username) {
                req.flash('error_msg', 'You cannot edit this profile');
                return res.redirect('/home');
            }

            const { userpassword, username, usernewpassword, usernewpassword2 } = req.body;
            const errors = [];

            // Verify current password
            const isMatch = await bcrypt.compare(userpassword, req.user.password);
            if (!isMatch) {
                req.flash('error_msg', 'Current password is incorrect');
                return res.redirect('/editprofile/' + req.user.username);
            }

            // If only updating name
            if (!usernewpassword && !usernewpassword2) {
                if (!username || username.trim().length === 0) {
                    errors.push({ text: 'Name cannot be empty' });
                } else if (username.length < 2) {
                    errors.push({ text: 'Name must be at least 2 characters long' });
                }

                if (errors.length > 0) {
                    return res.render('editprofile', {
                        curuser: req.user,
                        errors
                    });
                }

                const user = await User.findOne({ username: req.user.username });
                user.name = username.trim();
                await user.save();

                req.flash('success_msg', 'Name updated successfully');
                return res.redirect('/profile/' + req.user.username);
            }

            // If updating password
            if (!usernewpassword || !usernewpassword2) {
                errors.push({ text: 'All password fields are required' });
            } else if (usernewpassword !== usernewpassword2) {
                errors.push({ text: 'New passwords do not match' });
            } else if (usernewpassword.length < 6) {
                errors.push({ text: 'Password must be at least 6 characters long' });
            } else if (usernewpassword.includes(' ')) {
                errors.push({ text: 'Password cannot contain spaces' });
            }

            if (errors.length > 0) {
                return res.render('editprofile', {
                    curuser: req.user,
                    errors
                });
            }

            // Update password
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(usernewpassword, salt);

            const user = await User.findOne({ username: req.user.username });
            user.password = hash;
            await user.save();

            req.flash('success_msg', 'Password changed successfully');
            res.redirect('/profile/' + req.user.username);
        } catch (error) {
            logger.error('Profile edit error:', error);
            req.flash('error_msg', 'An error occurred while updating your profile');
            res.redirect('/editprofile/' + req.user.username);
        }
    }

    async getSubmissions(req, res) {
        try {
            const submissions = await Submission.find({ username: req.params.id })
                .sort({ date: 'desc' });

            res.render('submissions', {
                curuser: req.user,
                user: req.params.id,
                submission: submissions
            });
        } catch (error) {
            logger.error('Submissions view error:', error);
            req.flash('error_msg', 'An error occurred while loading submissions');
            res.redirect('/home');
        }
    }

    async getRanklist(req, res) {
        try {
            const users = await User.find({})
                .sort({ totalsolvecount: 'desc' });

            res.render('ranklist', {
                curuser: req.user,
                user: users
            });
        } catch (error) {
            logger.error('Ranklist view error:', error);
            req.flash('error_msg', 'An error occurred while loading the ranklist');
            res.redirect('/home');
        }
    }
}

module.exports = new UserController(); 