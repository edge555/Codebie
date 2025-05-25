const express = require('express');

// About us
exports.getAboutUs = (req, res) => {
    res.render('aboutus', {
        curuser: req.user
    });
};

// Error Route 
exports.getError = (req, res) => {
    res.render('error', {
        curuser: req.user
    });
};

// FAQ Route 
exports.getFaq = (req, res) => {
    res.render('faq', {
        curuser: req.user
    });
};

// Private policy route
exports.getPrivatePolicy = (req, res) => {
    res.render('privatepolicy', {
        curuser: req.user
    });
}; 