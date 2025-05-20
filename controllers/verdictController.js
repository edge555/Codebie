const submissionController = require('./submissionController');
const judge0Api = require('../helpers/judge0Api');

// Process submission and get verdicts
const processSubmission = async (req, submission, problem) => {
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
    }

    return tempverdicts;
};

// Create submission record
const createSubmissionRecord = async (req, verdicts, maxTime) => {
    const nowverdicts = verdicts.map((tv, index) => ({
        verdict: tv.substring(2, 4),
        time: tv.substring(4)
    }));

    const { finalVerdict, color } = submissionController.getVerdictDetails(
        nowverdicts.map(v => v.verdict)
    );

    const submissionData = {
        username: req.user.username,
        problemname: req.session.curproblem.name,
        problemcode: req.session.curproblem.code,
        token: req.session.curtoken,
        verdict: finalVerdict,
        verdicts: nowverdicts,
        time: maxTime,
        section: req.session.section,
        stdin: req.session.cursubmittedcode,
        lang: req.session.curlang
    };

    const submission = await submissionController.createSubmission(submissionData);
    await submissionController.updateUserStats(req.user, req.session.curproblem, finalVerdict);

    return { submission, finalVerdict, color };
};

module.exports = {
    processSubmission,
    createSubmissionRecord
}; 