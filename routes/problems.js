const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const { ensureAuthenticated } = require('../helpers/auth');
const { adminConfig } = require('../config/app');

// REST API Routes
router.get('/api/problems', problemController.getProblemsBySection.bind(problemController));

router.get('/api/problems/:id', problemController.getProblemByCode.bind(problemController));

router.post('/api/problems', ensureAuthenticated, async (req, res) => {
    if (!adminConfig.adminIds.includes(req.user.id)) {
        return res.apiForbidden('Access denied');
    }
    await problemController.addProblem(req, res);
});

router.put('/api/problems/:id', ensureAuthenticated, async (req, res) => {
    if (!adminConfig.adminIds.includes(req.user.id)) {
        return res.apiForbidden('Access denied');
    }
    await problemController.updateProblem(req, res);
});

router.delete('/api/problems/:id', ensureAuthenticated, async (req, res) => {
    if (!adminConfig.adminIds.includes(req.user.id)) {
        return res.apiForbidden('Access denied');
    }
    await problemController.deleteProblem(req, res);
});

router.post('/api/problems/:id/submit', ensureAuthenticated, problemController.submitSolution.bind(problemController));

router.get('/api/problems/solved', ensureAuthenticated, problemController.getSolvedProblems.bind(problemController));

// Legacy routes for backward compatibility
router.get('/problem', (req, res) => {
    res.render('problem', {
        user: req.user,
        problem: req.session.curproblem
    });
});

router.post('/problem', ensureAuthenticated, problemController.submitSolution.bind(problemController));

router.get('/problems/:id', problemController.getProblem);

router.get('/verdict', ensureAuthenticated, problemController.getVerdict);

// Helper functions
function getDefaultCode(section) {
    switch (section) {
        case 'c':
            return '#include <stdio.h>\nint main()\n{\n\n}';
        case 'java':
            return 'import java.util.*;\nclass Main {\n    public static void main(String[] args) {\n      Scanner sc = new Scanner(System.in);\n\n  }\n}';
        case 'py':
            return '';
        default:
            return '#include <bits/stdc++.h>\nusing namespace std;\nint main()\n{\n\n}';
    }
}

module.exports = router; 