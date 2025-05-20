const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const judge0Api = require('../helpers/judge0Api');
const utils = require('../helpers/utils');

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

module.exports = {
    getProblem,
    getProblemsBySection,
    getUserSolvedProblems,
    addProblem,
    updateProblem,
    deleteProblem,
    getProblemSubmissions,
    getUserProblemSubmissions,
    getDefaultCode,
    getLanguageSelection
}; 