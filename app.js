const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const Handlebars = require('handlebars');
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcryptjs');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
const app = express();
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const { exec } = require("child_process");
const fs = require('fs');
const unirest = require('unirest');
const { ensureAuthenticated } = require('./helpers/auth');
const { errorHandler } = require('./middleware/errorHandler');
const judgeService = require('./services/judgeService');
require('dotenv').config()

// Import configurations
const { adminConfig, handlebarsConfig, sessionConfig, mongoConfig, emailConfig } = require('./config/app');

// Import helpers
const handlebarsHelpers = require('./helpers/handlebarsHelpers');
const judge0Api = require('./helpers/judge0Api');
const getCounter = require('./helpers/counter');
const utils = require('./helpers/utils');
const mailService = require('./helpers/mailService');

// Import middleware
const flashMessages = require('./middleware/flash');
const apiResponse = require('./middleware/apiResponse');

// Load Models
require('./models/User');
const User = mongoose.model('users');
require('./models/Problem');
const Problem = mongoose.model('problems');
require('./models/Tutorial');
const Tutorial = mongoose.model('tutorials');
require('./models/Submission');
const Submission = mongoose.model('submissions');
require('./models/Token');
const Token = mongoose.model('tokens');
require('./models/Global');
const Global = mongoose.model('globals');

// Passport config
require('./config/passport')(passport);

const db = require('./config/database');
const { userInfo } = require('os');

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Express session
app.use(session(sessionConfig));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Handlebars Middleware
app.engine('handlebars', exphbs(handlebarsConfig));
app.set('view engine', 'handlebars');

// To use public folder
app.use(express.static(path.join(__dirname, 'public')));

// Flash messages middleware
app.use(flashMessages);

// API response middleware
app.use('/api', apiResponse);

// Import routes
const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const contactRoutes = require('./routes/contact');
const tutorialRoutes = require('./routes/tutorials');
const sectionRoutes = require('./routes/sections');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const indexRoutes = require('./routes/index');
const staticRoutes = require('./routes/static');

// Use routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', problemRoutes);
app.use('/', submissionRoutes);
app.use('/', contactRoutes);
app.use('/', tutorialRoutes);
app.use('/', sectionRoutes);
app.use('/', userRoutes);
app.use('/', adminRoutes);
app.use('/', staticRoutes);

// Connect to mongoose
mongoose.Promise = global.Promise;
mongoose.connect(db.mongoURI, mongoConfig)
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch(err => console.log(err));

// Create TTL index
var dbo;
MongoClient.connect(db.mongoURI, { useUnifiedTopology: true }, (err, db) => {
    if (err)
        throw err;
    dbo = db.db("codebie");
    dbo.collection("tokens")
        .createIndex({ "createdAt": 1 }, { expireAfterSeconds: 600 },
            (err, dbResult) => {
                if (!err){
                    console.log("Index Created");
                }
            });
});

// About us
app.get('/aboutus', function (req, res) {
    res.render('aboutus', {
        curuser: req.user
    });
});

// Contact us
// app.get('/contactus', function (req, res) { ... });
// app.post('/contactus', async function (req, res) { ... });

// Login/Signup Route
app.get('/enter', function (req, res) {
    if (req.user == null) {
        res.render('enter', {
            myid: adminConfig.development.myId,
            mypass: adminConfig.development.myPass
        });
    } else {
        res.redirect('home');
    }
});

// Login Post
app.post('/login', function (req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/enter',
        failureFlash: true
    })(req, res, next);
});

// Register post
// app.post('/register', async function (req, res) { ... });

// Error Route 
app.get('/error', function (req, res) {
    res.render('error', {
        curuser: req.user
    });
});

// FAQ Route 
app.get('/faq', function (req, res) {
    // Store number of problems in each sections
    res.render('faq', {
        curuser: req.user
    });
});

// Home Route
app.get('/home', async function (req, res) {
    try {
        const counter = await new Promise((resolve) => {
            getCounter(resolve);
        });

        res.render('home', {
            curuser: req.user,
            counter: counter,
            userCount: userCount,
            submissionCount: submissionCount
        });
    } catch (error) {
        console.error('Error in home route:', error);
        req.flash('error_msg', 'An error occurred while loading the home page');
        res.redirect('/');
    }
});

app.post('/home', function (req, res) {
    req.session.section = req.body.submit;
    res.redirect('/section/' + req.session.section);
});

// Logout route
app.get('/logout', function (req, res) {
    req.logout();
    req.flash('success_msg', 'Logged Out');
    res.redirect('/');
});

// Private policy route
app.get('/privatepolicy', function (req, res) {
    res.render('privatepolicy', {
        curuser: req.user
    })
});

// Problem show and submit page
// app.get('/problem', function (req, res) { ... });
// app.post('/problem', ensureAuthenticated, async function (req, res) { ... });
// app.get('/problems/:id', function (req, res) { ... });
// app.get('/submission/:id', ensureAuthenticated, function (req, res) { ... });
// app.get('/recent', function (req, res) { ... });
// app.get('/verdict', ensureAuthenticated, async function (req, res) { ... });

// Profile page
// app.get('/profile/:id', function (req, res) { ... });

// Recent page
// app.get('/recent', function (req, res) { ... });

app.get('/resetpass/:id', function (req, res) {
    if (req.user) {
        return res.redirect('/home');
    }
    res.render('resetpass', {
        id: req.params.id,
        errors: [],
        error_msg: req.flash('error_msg')
    });
});

app.post('/resetpass/:id', async function (req, res) {
    try {
        const errors = [];
        const { usernewpassword, usernewpassword2 } = req.body;

        // Validate passwords
        if (!usernewpassword || !usernewpassword2) {
            errors.push({ text: "All fields are required" });
        } else if (usernewpassword !== usernewpassword2) {
            errors.push({ text: "Passwords do not match" });
        } else if (usernewpassword.length < 6) {
            errors.push({ text: "Password must be at least 6 characters long" });
        } else if (!isValidPass(usernewpassword)) {
            errors.push({ text: "Password cannot contain spaces" });
        }

        if (errors.length > 0) {
            return res.render('resetpass', {
                id: req.params.id,
                errors: errors
            });
        }

        // Find token and user
        const token = await Token.findOne({ token: req.params.id });
        if (!token) {
            req.flash('error_msg', 'Invalid or expired reset token');
            return res.redirect('/enter');
        }

        const user = await User.findOne({ email: token.email });
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/enter');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(usernewpassword, salt);

        // Update user password
        user.password = hash;
        await user.save();

        // Delete used token
        await Token.deleteOne({ token: req.params.id });

        req.flash('success_msg', 'Password has been reset successfully. You can now log in with your new password.');
        res.redirect('/enter');
    } catch (error) {
        console.error('Password reset error:', error);
        req.flash('error_msg', 'An error occurred while resetting your password');
        res.redirect('/enter');
    }
});

// Show section route
// app.get('/section/:id', function (req, res) { ... });

// View submission
// app.get('/submission/:id', ensureAuthenticated, function (req, res) { ... });

// Token route
app.get('/token/:id', async function (req, res) {
    try {
        if (req.user) {
            return res.redirect('/home');
        }

        const token = await Token.findOne({ token: req.params.id });
        if (!token) {
            req.flash('error_msg', 'Token expired or invalid');
            return res.redirect('/enter');
        }

        if (token.purpose === "resetpass") {
            return res.redirect('/resetpass/' + req.params.id);
        }

        if (token.purpose === "activation") {
            const [username, email, password] = token.info;
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            // Create new user
            const newUser = new User({
                username,
                email,
                password: hash,
                dateJoined: getBDTime()
            });

            await newUser.save();
            await Token.deleteOne({ token: req.params.id });

            req.flash('success_msg', 'Account activation successful. You can now log in.');
            return res.redirect('/enter');
        }

        req.flash('error_msg', 'Invalid token purpose');
        res.redirect('/enter');
    } catch (error) {
        console.error('Token activation error:', error);
        req.flash('error_msg', 'An error occurred during account activation');
        res.redirect('/enter');
    }
});

// Verdict route
// app.get('/verdict', ensureAuthenticated, async function (req, res) { ... });

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));