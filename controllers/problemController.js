const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const judge0Api = require('../helpers/judge0Api');
const utils = require('../helpers/utils');
const problemService = require('../services/problemService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../helpers/logger');
const judgeService = require('../services/judgeService');

// Get problem by code
const getProblem = async (code) => {
    return await Problem.findOne({ code }).lean();
};

// Get all problems by section
const getProblemsBySection = async (section) => {
    return await Problem.find({ section })
        .sort({ difficulty: 'asc' })
        .lean();
};

// Get user's solved problems
const getUserSolvedProblems = (user, section) => {
    const solvedCodes = user.solved
        .filter(solve => solve.section === section)
        .map(solve => solve.code);
    return solvedCodes;
};

// Add new problem
const addProblem = async (problemData) => {
    const newProblem = new Problem({
        ...problemData,
        solvecount: 0,
        dateAdded: utils.getBDTime()
    });
    return await newProblem.save();
};

// Update problem
const updateProblem = async (code, problemData) => {
    return await Problem.findOneAndUpdate(
        { code },
        problemData,
        { new: true }
    );
};

// Delete problem
const deleteProblem = async (code) => {
    return await Problem.deleteOne({ code });
};

// Get problem submissions
const getProblemSubmissions = async (problemCode) => {
    return await Submission.find({ problemcode: problemCode })
        .sort({ date: 'desc' });
};

// Get user's submissions for a problem
const getUserProblemSubmissions = (submissions, username) => {
    return submissions.filter(submission => submission.username === username);
};

// Get default code for language
const getDefaultCode = (language) => {
    const defaultCodes = {
        c: "#include <stdio.h>\nint main()\n{\n\n}",
        cpp: "#include <bits/stdc++.h>\nusing namespace std;\nint main()\n{\n\n}",
        java: "import java.util.*;\nclass Main {\n    public static void main(String[] args) {\n      Scanner sc = new Scanner(System.in);\n\n  }\n}",
        py: ""
    };
    return defaultCodes[language] || defaultCodes.cpp;
};

// Get language selection
const getLanguageSelection = (section) => {
    const selected = {
        c: "",
        cpp: "",
        java: "",
        py: ""
    };
    selected[section] = "selected";
    return selected;
};

class ProblemController {
    async getProblemByCode(req, res, next) {
        try {
            const problem = await problemService.getProblemByCode(req.params.id);
            res.apiSuccess(problem);
        } catch (error) {
            next(error);
        }
    }

    async getProblemsBySection(req, res, next) {
        try {
            const problems = await problemService.getProblemsBySection(req.query.section);
            res.apiSuccess(problems);
        } catch (error) {
            next(error);
        }
    }

    async addProblem(req, res, next) {
        try {
            const problem = await problemService.addProblem(req.body);
            res.apiSuccess(problem, 'Problem created successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateProblem(req, res, next) {
        try {
            const problem = await problemService.updateProblem(req.params.id, req.body);
            res.apiSuccess(problem, 'Problem updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteProblem(req, res, next) {
        try {
            await problemService.deleteProblem(req.params.id);
            res.apiSuccess(null, 'Problem deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async submitSolution(req, res, next) {
        try {
            if (!req.user) {
                throw new AppError('You must be logged in to submit', 401);
            }

            if (!req.body.code) {
                throw new AppError('Code is required', 400);
            }

            const result = await problemService.submitSolution(req.params.id, {
                code: req.body.code,
                language: req.body.language || req.session.section
            });

            // Store submission details in session for verdict page
            req.session.curproblem = result.problem;
            req.session.curtoken = result.results[0].token;
            req.session.curoutput = result.results[0];
            req.session.curverdicts = result.results.map(r => r.status);
            req.session.curtls = result.results.map(r => r.time);
            req.session.cursubmittedcode = req.body.code;
            req.session.curlang = req.body.language || req.session.section;

            res.apiSuccess(result, 'Solution submitted successfully');
        } catch (error) {
            next(error);
        }
    }

    async getSolvedProblems(req, res, next) {
        try {
            if (!req.user) {
                throw new AppError('You must be logged in', 401);
            }
            const problems = await problemService.getSolvedProblemsByUser(req.user.username);
            res.apiSuccess(problems);
        } catch (error) {
            next(error);
        }
    }

    async getProblem(req, res) {
        try {
            const problem = await Problem.findOne({ code: req.params.id }).lean();
            if (!problem) {
                req.flash('error_msg', 'Problem not found');
                return res.redirect('/home');
            }

            req.session.section = problem.section;
            req.session.curproblem = problem;

            const sampleio = [];
            for (let i = 0; i < problem.samplecount; i++) {
                sampleio.push([problem.inputs[i], problem.outputs[i]]);
            }

            const submissions = await Submission.find({ problemcode: problem.code })
                .sort({ date: 'desc' });

            const curmysub = [];
            if (req.user) {
                submissions.forEach(submission => {
                    if (submission.username === req.user.username) {
                        curmysub.push(submission);
                    }
                });
            }

            const selected = {
                c: "",
                cpp: "",
                java: "",
                py: "",
            };

            let defaultCode = "#include <bits/stdc++.h>\nusing namespace std;\nint main()\n{\n\n}";
            if (req.session.section === "c") {
                selected.c = "selected";
                defaultCode = "#include <stdio.h>\nint main()\n{\n\n}";
            } else if (req.session.section === "java") {
                selected.java = "selected";
                defaultCode = "import java.util.*;\nclass Main {\n    public static void main(String[] args) {\n      Scanner sc = new Scanner(System.in);\n\n  }\n}";
            } else if (req.session.section === "py") {
                selected.py = "selected";
                defaultCode = "";
            } else {
                selected.cpp = "selected";
            }

            res.render('problem', {
                curproblem: problem,
                defaultCode: defaultCode,
                curuser: req.user,
                curmysub: curmysub,
                curallsub: submissions,
                sampleio: sampleio,
                selected: selected
            });
        } catch (error) {
            logger.error('Problem view error:', error);
            req.flash('error_msg', 'An error occurred while loading the problem');
            res.redirect('/home');
        }
    }

    async submitProblem(req, res) {
        try {
            if (!req.user) {
                req.flash('error_msg', 'You must be logged in to submit');
                return res.redirect('/enter');
            }

            if (!req.body.submittedcode || req.body.submittedcode.length === 0) {
                req.session.verdict = "Compilation Error";
                req.session.curtoken = null;
                req.session.curoutput = null;
                return res.redirect('verdict');
            }

            const problem = await Problem.findOne({ code: req.body.probcode }).lean();
            if (!problem) {
                req.flash('error_msg', 'Problem not found');
                return res.redirect('/home');
            }

            req.session.curproblem = problem;
            req.session.section = problem.section;
            const tempLang = (problem.section === 'ds' || problem.section === 'algo') ? req.body.language : problem.section;
            req.session.cursubmittedcode = req.body.submittedcode;

            const submission = {
                code: req.body.submittedcode,
                language: tempLang
            };

            const testcasecount = problem.testcasecount;
            const inputs = problem.inputs;
            const outputs = problem.outputs;
            const tempverdicts = [];
            let temp = null;

            // Process all test cases
            for (let i = 0; i < testcasecount; i++) {
                try {
                    // Submit code to Judge0
                    const token = await judgeService.submitCode(
                        submission.code,
                        submission.language,
                        inputs[i],
                        outputs[i],
                        problem.timelimit
                    );

                    // Wait for result
                    await new Promise(resolve => setTimeout(resolve, 7000));
                    const result = await judgeService.getSubmissionResult(token);

                    // Process result
                    const verdict = result.status.description;
                    const time = result.time || '0';
                    tempverdicts.push(`${i} ${verdict} ${time}`);
                    temp = [submission.language, token, result];
                } catch (error) {
                    logger.error(`Test case ${i} error:`, error);
                    tempverdicts.push(`${i} CE 0`);
                    temp = [submission.language, null, {
                        status: { id: 6, description: 'Runtime Error' },
                        stdout: '',
                        time: '0',
                        memory: 0,
                        stderr: null,
                        compile_output: null,
                        message: null
                    }];
                }
            }

            req.session.curlang = temp[0];
            req.session.curtoken = temp[1];
            req.session.curoutput = temp[2];
            tempverdicts.sort();

            req.session.curverdicts = [];
            req.session.curtls = [];
            tempverdicts.forEach(tv => {
                req.session.curverdicts.push(tv.substring(2, 4));
                req.session.curtls.push(tv.substring(4));
            });

            res.redirect('verdict');
        } catch (error) {
            logger.error('Problem submission error:', error);
            req.flash('error_msg', 'An error occurred while processing your submission');
            res.redirect('/home');
        }
    }

    async getVerdict(req, res) {
        try {
            let maxtl = 0;
            let nowverdicts = [];
            let verdict = "Compilation Error";

            if (req.session.curoutput === null) {
                if (req.session.curtoken) {
                    const newSubmission = {
                        username: req.user.username,
                        problemname: req.session.curproblem.name,
                        problemcode: req.session.curproblem.code,
                        token: req.session.curtoken,
                        time: 0,
                        verdict: verdict,
                        verdicts: nowverdicts,
                        section: req.session.section,
                        stdin: req.session.cursubmittedcode,
                        lang: req.session.curlang,
                        date: new Date()
                    };
                    await new Submission(newSubmission).save();
                }
            } else {
                const user = await User.findOne({ username: req.user.username });
                let alreadysolved = false;
                let ce = false, wa = false, tl = false, lr = false, re = false;

                req.session.curverdicts.forEach(cv => {
                    if (cv === "WA") wa = true;
                    else if (cv === "CE") ce = true;
                    else if (cv === "TL") tl = true;
                    else if (cv === "LR") lr = true;
                    else if (cv === "RE") re = true;
                });

                if (lr) verdict = "Language Rejected";
                else if (ce) verdict = "Compilation Error";
                else if (re) verdict = "Runtime Error";
                else if (tl) verdict = "Time Limit Exceeded";
                else if (wa) verdict = "Wrong Answer";
                else verdict = "Accepted";

                if (verdict === "Accepted") {
                    user.solved.forEach(solve => {
                        if (solve.code === req.session.curproblem.code) {
                            alreadysolved = true;
                        }
                    });

                    if (!alreadysolved) {
                        if (req.session.section === "c") user.csolvecount++;
                        else if (req.session.section === "cpp") user.cppsolvecount++;
                        else if (req.session.section === "java") user.javasolvecount++;
                        else if (req.session.section === "py") user.pysolvecount++;
                        else if (req.session.section === "ds") user.dssolvecount++;
                        else if (req.session.section === "algo") user.algosolvecount++;

                        user.totalsolvecount++;
                        user.solved.unshift({
                            code: req.session.curproblem.code,
                            section: req.session.section
                        });
                        await user.save();

                        const problem = await Problem.findOne({ code: req.session.curproblem.code });
                        problem.solvecount++;
                        await problem.save();
                    }
                }

                for (let i = 0; i < req.session.curverdicts.length; i++) {
                    const newVerd = {
                        verdict: req.session.curverdicts[i],
                        time: req.session.curtls[i]
                    };
                    maxtl = Math.max(maxtl, req.session.curtls[i]);
                    nowverdicts.push(newVerd);
                }

                const newSubmission = {
                    username: req.user.username,
                    problemname: req.session.curproblem.name,
                    problemcode: req.session.curproblem.code,
                    token: req.session.curtoken,
                    verdict: verdict,
                    verdicts: nowverdicts,
                    time: maxtl,
                    section: req.session.section,
                    stdin: req.session.cursubmittedcode,
                    lang: req.session.curlang,
                    date: new Date()
                };
                await new Submission(newSubmission).save();
            }

            const color = verdict === "Accepted" ? "green" : "red";
            res.render('verdict', {
                curuser: req.user,
                verdict: verdict,
                curverdicts: req.session.curverdicts,
                curtls: req.session.curtls,
                curoutput: req.session.curoutput,
                maxtl: maxtl,
                color: color
            });
        } catch (error) {
            logger.error('Verdict error:', error);
            req.flash('error_msg', 'An error occurred while processing your submission');
            res.redirect('/home');
        }
    }
}

module.exports = new ProblemController(); 