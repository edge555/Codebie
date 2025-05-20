const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { ensureAuthenticated } = require('../helpers/auth');
const utils = require('../helpers/utils');
const mailService = require('../helpers/mailService');
const User = require('../models/User');
const Token = require('../models/Token');

// Login/Signup Route
router.get('/enter', function (req, res) {
    if (req.user == null) {
        res.render('enter', {
            myid: myid,
            mypass: mypass
        });
    } else {
        res.redirect('home');
    }
});

// Login Post
router.post('/login', function (req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/enter',
        failureFlash: true
    })(req, res, next);
});

// Register post
router.post('/register', function (req, res) {
    var errors = [];
    Token.findOne({
        email: req.body.signupemail,
        purpose: "activation"
    })
        .then(tokens => {
            if (tokens) {
                errors.push({ text: "An activation token already exists. Please wait for a few minutes" });
            }
        });
    User.findOne({ email: req.body.signupemail })
        .then(user => {
            if (user) {
                errors.push({ text: "Email already registered" });
            }
        });
    User.findOne({ username: req.body.signupusername })
        .then(user => {
            if (user) {
                errors.push({ text: "Username already taken" });
            }
        });

    if (!utils.isValid(req.body.signupusername)) {
        errors.push({ text: "Invalid username" });
    }
    if (req.body.signupusername.length < 6) {
        errors.push({ text: "Username too short, Minimum 6 characters" });
    }
    if (!utils.isValidPass(req.body.signuppass)) {
        errors.push({ text: "Invalid password" });
    }
    if (req.body.signuppass.length < 6) {
        errors.push({ text: "Password too short, Minimum 6 characters" });
    }
    if (req.body.signuppass != req.body.signuppass2) {
        errors.push({ text: "Password doesn't match" });
    }
    setTimeout(function () {
        if (errors.length != 0) {
            res.render('enter', {
                errors: errors,
                email: req.body.signupemail,
                username: req.body.signupusername
            })
        } else {
            var info = [];
            info.push(req.body.signupusername);
            info.push(req.body.signupemail);
            info.push(req.body.signuppass);
            var token = utils.randomString();
            var temp = {
                createdAt: new Date(),
                token: token,
                purpose: "activation",
                email: req.body.signupemail,
                info: info
            };
            dbo.collection("tokens").insertOne(temp, (err, doc) => {
                if (!err)
                    console.log('Token inserted');
            });
            var subject = "Codebie Registration"
            var text = "Welcome to Codebie! Please click on this link http://" + url + "/token/" + token + " to activate your account. This link will expire after 10 minutes.";
            mailService.sendMail(process.env.NODEMAILER_MAIL, req.body.signupemail, subject, text)
            req.flash('success_msg', 'Registration Successful. An email will be sent to your inbox with activation link within 3 minutes.');
            res.redirect('/enter');
        }
    }, 8000);
});

// Logout route
router.get('/logout', function (req, res) {
    req.logout();
    req.flash('success_msg', 'Logged Out');
    res.redirect('/');
});

module.exports = router; 