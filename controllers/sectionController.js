const Problem = require('../models/Problem');
const Tutorial = require('../models/Tutorial');
const logger = require('../helpers/logger');

// Get section content
const getSectionContent = async (section, user) => {
    try {
        // Get problems and tutorials in parallel
        const [problems, tutorials] = await Promise.all([
            Problem.find({ section }).sort({ difficulty: 'asc' }).lean(),
            Tutorial.find({ section }).lean()
        ]);

        // Separate solved and unsolved problems if user is logged in
        let solvedProblems = [];
        let unsolvedProblems = [];

        if (user) {
            const solvedCodes = user.solved
                .filter(solve => solve.section === section)
                .map(solve => solve.code);

            problems.forEach(problem => {
                if (solvedCodes.includes(problem.code)) {
                    solvedProblems.push(problem);
                } else {
                    unsolvedProblems.push(problem);
                }
            });
        } else {
            unsolvedProblems = problems;
        }

        return {
            solvedProblems,
            unsolvedProblems,
            tutorials
        };
    } catch (error) {
        console.error('Error getting section content:', error);
        throw error;
    }
};

// Get section statistics
const getSectionStats = async (section) => {
    try {
        const [problemCount, tutorialCount] = await Promise.all([
            Problem.countDocuments({ section }),
            Tutorial.countDocuments({ section })
        ]);

        return {
            problemCount,
            tutorialCount
        };
    } catch (error) {
        console.error('Error getting section stats:', error);
        throw error;
    }
};

class SectionController {
    async getSection(req, res) {
        try {
            const tutorials = await Tutorial.find({ section: req.params.id }).lean();
            const problems = await Problem.find({ section: req.params.id })
                .sort({ difficulty: 'asc' })
                .lean();

            // Separate solved and unsolved problems
            const mysolvedcode = [];
            const cursolvedproblems = [];
            const curnotsolvedproblems = [];

            if (req.user) {
                req.user.solved.forEach(solve => {
                    if (solve.section === req.session.section) {
                        mysolvedcode.push(solve.code);
                    }
                });

                problems.forEach(problem => {
                    if (mysolvedcode.includes(problem.code)) {
                        cursolvedproblems.push(problem);
                    } else {
                        curnotsolvedproblems.push(problem);
                    }
                });
            } else {
                problems.forEach(problem => {
                    curnotsolvedproblems.push(problem);
                });
            }

            res.render('section', {
                curuser: req.user,
                cursolvedproblems: cursolvedproblems,
                curnotsolvedproblems: curnotsolvedproblems,
                curtutorials: tutorials
            });
        } catch (error) {
            logger.error('Section view error:', error);
            req.flash('error_msg', 'An error occurred while loading the section');
            res.redirect('/home');
        }
    }
}

module.exports = new SectionController(); 