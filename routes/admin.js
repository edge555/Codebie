const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../helpers/auth');
const adminController = require('../controllers/adminController');

// Admin panel routes
router.get('/admin', ensureAuthenticated, adminController.getAdminPanel);
router.post('/admin', ensureAuthenticated, adminController.handleAdminAction);

// Problem management routes
router.get('/admin/addproblem', ensureAuthenticated, adminController.getAddProblem);
router.post('/admin/addproblem', ensureAuthenticated, adminController.addProblem);
router.get('/admin/editproblem', ensureAuthenticated, adminController.getEditProblem);
router.post('/admin/editproblem', ensureAuthenticated, adminController.editProblem);

// Tutorial management routes
router.get('/admin/addtutorial', ensureAuthenticated, adminController.getAddTutorial);
router.post('/admin/addtutorial', ensureAuthenticated, adminController.addTutorial);
router.get('/admin/edittutorial', ensureAuthenticated, adminController.getEditTutorial);
router.post('/admin/edittutorial', ensureAuthenticated, adminController.editTutorial);

module.exports = router; 