const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../helpers/auth');
const problemController = require('../controllers/problemController');
const { adminConfig } = require('../config/app');

// Show problem page
router.get('/problem', function (req, res) {
    res.render('problem', {
        curuser: req.user,
        curproblem: req.session.curproblem
    });
});

// Submit problem solution
router.post('/problem', ensureAuthenticated, async function (req, res) {
    if (!req.user) {
        req.flash('error_msg', 'You must be logged in to submit');
        return res.redirect('/enter');
    }

    if (req.body.submittedcode.length === 0) {
        req.session.verdict = "Compilation Error";
        req.session.curtoken = null;
        req.session.curoutput = null;
        return res.redirect('verdict');
    }

    const problem = await problemController.getProblem(req.body.probcode);
    if (!problem) {
        req.flash('error_msg', 'Problem not found');
        return res.redirect('/home');
    }

    req.session.curproblem = problem;
    req.session.section = problem.section;
    
    let tempLang = problem.section;
    if (problem.section === 'ds' || problem.section === 'algo') {
        tempLang = req.body.language;
    }

    req.session.cursubmittedcode = req.body.submittedcode;
    const submission = {
        code: req.body.submittedcode,
        language: tempLang
    };

    const testcasecount = problem.testcasecount;
    const inputs = problem.inputs;
    const outputs = problem.outputs;
    const tempverdicts = [];

    for (let i = 0; i < testcasecount; i++) {
        const verdict = await judge0Api.getverdict(req, submission, inputs[i], outputs[i], i);
        if (verdict[1][2].time != null) {
            tempverdicts.push(verdict[0] + " " + verdict[1][2].time.toString());
        } else {
            tempverdicts.push(verdict[0] + " 0");
        }
        temp = verdict[1];
    }

    setTimeout(function () {
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
    }, 10000);
});

// Get problem by ID
router.get('/problems/:id', async function (req, res) {
    const problem = await problemController.getProblem(req.params.id);
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

    const submissions = await problemController.getProblemSubmissions(problem.code);
    const curmysub = req.user ? problemController.getUserProblemSubmissions(submissions, req.user.username) : [];
    
    const selected = problemController.getLanguageSelection(req.session.section);
    const defaultCode = problemController.getDefaultCode(req.session.section);

    res.render('problem', {
        curproblem: problem,
        defaultCode,
        curuser: req.user,
        curmysub,
        curallsub: submissions,
        sampleio,
        selected
    });
});

// Admin routes
router.get('/admin/addproblem', ensureAuthenticated, function (req, res) {
    if (adminConfig.adminIds.includes(req.user.username)) {
        res.render('admin/addproblem');
    } else {
        res.render('accessdenied');
    }
});

router.post('/admin/addproblem', ensureAuthenticated, async function (req, res) {
    if (!adminConfig.adminIds.includes(req.user.username)) {
        return res.render('accessdenied');
    }

    const testcasecount = req.body.testcasecount;
    const inputs = [], outputs = [];
    for (let i = 0; i < testcasecount; i++) {
        inputs.push(eval(`req.body.input${i}`));
        outputs.push(eval(`req.body.output${i}`));
    }

    const problemData = {
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
        inputs,
        outputs,
        section: req.body.section,
        tags: req.body.tags
    };

    await problemController.addProblem(problemData);
    res.redirect('/admin');
});

module.exports = router; 