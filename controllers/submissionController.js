const Submission = require('../models/Submission');
const User = require('../models/User');
const Problem = require('../models/Problem');
const utils = require('../helpers/utils');
const logger = require('../helpers/logger');

// Create new submission
const createSubmission = async (submissionData) => {
    const newSubmission = new Submission({
        ...submissionData,
        date: utils.getBDTime()
    });
    return await newSubmission.save();
};

// Get submission by token
const getSubmissionByToken = async (token) => {
    return await Submission.findOne({ token });
};

// Get user's submissions
const getUserSubmissions = async (username) => {
    return await Submission.find({ username })
        .sort({ date: 'desc' });
};

// Get recent submissions
const getRecentSubmissions = async (limit = 20) => {
    return await Submission.find({})
        .sort({ date: 'desc' })
        .limit(limit);
};

// Update user stats after submission
const updateUserStats = async (user, problem, verdict) => {
    if (verdict === "Accepted") {
        const alreadySolved = user.solved.some(solve => solve.code === problem.code);
        if (!alreadySolved) {
            // Update section-specific solve count
            const sectionField = `${problem.section}solvecount`;
            user[sectionField]++;
            user.totalsolvecount++;

            // Add to solved problems
            user.solved.unshift({
                code: problem.code,
                section: problem.section
            });

            // Update problem solve count
            await Problem.findOneAndUpdate(
                { code: problem.code },
                { $inc: { solvecount: 1 } }
            );

            await user.save();
        }
    }
};

// Get submission verdict details
const getVerdictDetails = (verdicts) => {
    let finalVerdict = "Accepted";
    let color = "green";

    const hasVerdict = (type) => verdicts.some(v => v === type);

    if (hasVerdict("LR")) {
        finalVerdict = "Language Rejected";
    } else if (hasVerdict("CE")) {
        finalVerdict = "Compilation Error";
    } else if (hasVerdict("RE")) {
        finalVerdict = "Runtime Error";
    } else if (hasVerdict("TL")) {
        finalVerdict = "Time Limit Exceeded";
    } else if (hasVerdict("WA")) {
        finalVerdict = "Wrong Answer";
        color = "red";
    }

    return { finalVerdict, color };
};

// Check if user can view submission
const canViewSubmission = (submission, user) => {
    if (submission.username === user.username) {
        return true;
    }
    return user.solved.some(solve => solve.code === submission.problemcode);
};

class SubmissionController {
    async getSubmission(req, res) {
        try {
            const submission = await Submission.findOne({ token: req.params.id });
            if (!submission) {
                req.flash('error_msg', 'Submission not found');
                return res.redirect('/home');
            }

            let canSee = false;
            if (submission.username === req.user.username) {
                canSee = true;
            } else {
                req.user.solved.forEach(solve => {
                    if (solve.code === submission.problemcode) {
                        canSee = true;
                    }
                });
            }

            res.render('submission', {
                curuser: req.user,
                submission: submission,
                canSee: canSee
            });
        } catch (error) {
            logger.error('Submission view error:', error);
            req.flash('error_msg', 'An error occurred while loading the submission');
            res.redirect('/home');
        }
    }

    async getRecentSubmissions(req, res) {
        try {
            const submissions = await Submission.find({})
                .sort({ date: 'desc' })
                .limit(20);

            res.render('recent', {
                curuser: req.user,
                submission: submissions
            });
        } catch (error) {
            logger.error('Recent submissions error:', error);
            req.flash('error_msg', 'An error occurred while loading recent submissions');
            res.redirect('/home');
        }
    }
}

module.exports = new SubmissionController(); 