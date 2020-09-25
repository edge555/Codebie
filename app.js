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
const app = express();
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const { exec } = require("child_process");
const fs = require('fs');
const unirest = require('unirest');
const { ensureAuthenticated } = require('./helpers/auth');

var curmysub = [],
    cursolvedproblems = [],
    curnotsolvedproblems = [],
    adminids = ["edge555"];
var section, curuser, curlang, curtoken, verdict;
var curproblem, curproblems, curtutorial, curtutorials;
var cursubmittedcode, cureditproblem, curedittutorial;
var curdeleteproblem, curdeletetutorial, curoutput;

// Node mailer email
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'codebie.infedgelab@gmail.com',
        pass: 'dummypassw0rd'
    }
});

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

// Passport config
require('./config/passport')(passport);

const db = require('./config/database');
// Connect to mongoose
mongoose.Promise = global.Promise;
mongoose.connect(db.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then((err, db) => {
        console.log('MongoDB Connected')
    })
    .catch(err => console.log(err));

// Create TTL index
var dbo;
MongoClient.connect(db.mongoURI, { useUnifiedTopology: true }, (err, db) => {
    if (err)
        throw err;
    //Retrieve your chosen database and collection (table)
    dbo = db.db("codebie");
    dbo.collection("tokens")
        .createIndex({ "createdAt": 1 }, { expireAfterSeconds: 600 },
            (err, dbResult) => {
                if (err) throw err;
                console.log("Index Created");
            });

})

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Express session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Handlebars Middleware
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
        // Function to do basic mathematical operation in handlebar
        math: function(lvalue, operator, rvalue) {
            lvalue = parseFloat(lvalue);
            rvalue = parseFloat(rvalue);
            return {
                "+": lvalue + rvalue,
                "-": lvalue - rvalue,
                "*": lvalue * rvalue,
                "/": lvalue / rvalue,
                "%": lvalue % rvalue,
                "x": (lvalue * 100) / rvalue
            }[operator];
        },
        // To formate Js Date
        prettifyDate: function(timestamp, check) {
            function addZero(i) {
                if (i < 10) {
                    i = "0" + i;
                }
                return i;
            }
            temp = "AM";
            var curr_date = timestamp.getDate();
            var curr_month = timestamp.getMonth();
            curr_month++;
            var curr_year = timestamp.getFullYear() % 100;
            var curr_hour = timestamp.getHours();
            if (curr_hour > 12) {
                curr_hour -= 12;
                temp = "PM";
            } else if (curr_hour == 0) {
                curr_hour = 12;
            }
            var curr_minutes = timestamp.getMinutes();
            if (check == 1) {
                result = addZero(curr_hour) + ':' + addZero(curr_minutes) + ' ' + temp + ' ' +
                    addZero(curr_date) + "/" + addZero(curr_month) + "/" + addZero(curr_year);
            } else {
                result = addZero(curr_date) + "/" + addZero(curr_month) + "/" + addZero(curr_year);
            }
            return result;
        },
        // Comparing object
        ifCond: function(v1, operator, v2, options) {
            switch (operator) {
                case '==':
                    return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case '===':
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case '!=':
                    return (v1 != v2) ? options.fn(this) : options.inverse(this);
                case '!==':
                    return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                case '<':
                    return (v1 < v2) ? options.fn(this) : options.inverse(this);
                case '<=':
                    return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                case '>':
                    return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case '>=':
                    return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                case '&&':
                    return (v1 && v2) ? options.fn(this) : options.inverse(this);
                case '||':
                    return (v1 || v2) ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        },
        fullLang: function(lang) {
            switch (lang) {
                case 'c':
                    return "C";
                case 'cpp':
                    return "C++";
                case 'java':
                    return "Java";
                case 'py':
                    return "Python";
                case 'ds':
                    return "Data Structure"
                case 'algo':
                    return "Algorithm";
                default:
                    return lang;
            }
        },
        breaklines: function(text) {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
            return new Handlebars.SafeString(text);
        }
    }
}));

app.set('view engine', 'handlebars');
// To use public folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Counter for problem sections
function getCounter(callback) {
    counter = {
        ccnt: 0,
        cppcnt: 0,
        javacnt: 0,
        pycnt: 0,
        dscnt: 0,
        algocnt: 0,
        totalcnt: 0
    }
    Problem.find({})
        .then(problems => {
            //console.log(problems);
            problems.forEach(problem => {
                //console.log(problem.section);
                if (problem.section == "c") {
                    counter.ccnt++;
                } else if (problem.section == "cpp") {
                    counter.cppcnt++;
                } else if (problem.section == "java") {
                    counter.javacnt++;
                } else if (problem.section == "py") {
                    counter.pycnt++;
                } else if (problem.section == "ds") {
                    counter.dscnt++;
                } else if (problem.section == "algo") {
                    counter.algocnt++;
                }
                counter.totalcnt++
            });
            callback(counter);
        });
}

// Judge0 API call to get execution info
function getoutput(submissiontoken, callback) {
    console.log(submissiontoken);
    var req = unirest("GET", "https://judge0.p.rapidapi.com/submissions/" + submissiontoken);
    req.headers({
        "x-rapidapi-host": "judge0.p.rapidapi.com",
        "x-rapidapi-key": "f29463abbdmsh6850c751a0bc89fp11dfc2jsn113becd1a344",
        "useQueryString": true
    });
    req.end(function(res) {
        if (res.error) {
            verdict = "Compilation Error";
            callback(verdict);
        } else {
            callback(res.body);
        }
    });
}

// Judge0 API call for submitting code
function gettoken(submission, input, callback) {
    // Judge0 API for submitting code
    var req = unirest("POST", "https://judge0.p.rapidapi.com/submissions");
    req.headers({
        "x-rapidapi-host": "judge0.p.rapidapi.com",
        "x-rapidapi-key": "f29463abbdmsh6850c751a0bc89fp11dfc2jsn113becd1a344",
        "content-type": "application/json",
        "accept": "application/json",
        "useQueryString": true
    });
    /* 
    Language ids:
    C (GCC 9.2.0) : 50,
    C++ (GCC 7.4.0) : 52,
    Java (OpenJDK 8) : 27,
    Python (3.8.1) : 71
    */
    //console.log(submission);
    var lang_id;
    curlang = submission.language;
    if (submission.language == "c") {
        lang_id = 50;
    } else if (submission.language == "cpp") {
        lang_id = 52;
    } else if (submission.language == "java") {
        lang_id = 27;
    } else {
        lang_id = 71;
    }
    req.type("json");
    req.send({
        "language_id": lang_id,
        "source_code": submission.code,
        "stdin": input
    });
    req.end(function(res) {
        if (res.error)
            throw new Error(res.error);
        callback(res.body.token);
    });
}

// Get verdict
function getverdict(submission, input, output, callback) {
    var submissiontoken, tempverdict;
    var token = gettoken(submission, input, function(result) {
        submissiontoken = result;
        curtoken = submissiontoken;
    });
    setTimeout(function() {
        //console.log(submissiontoken);
        var check = getoutput(submissiontoken, function(result) {
            curoutput = result;
            if (section != "algo" && section != "ds" && section != submission.language) {
                tempverdict = "Language Rejected";
            } else {
                if (result == "Compilation Error") {
                    curoutput = null;
                    tempverdict = result;
                } else {
                    if (curoutput.time > curproblem.timelimit) {
                        tempverdict = "Time Limit";
                    } else if (curoutput.stdout == output) {
                        tempverdict = "Accepted";
                    } else {
                        tempverdict = "Wrong Answer";
                    }
                }
            }
            callback(tempverdict);
        });
    }, 7000);
}

// Valid checking regex
function isValid(text) {
    return /^[0-9a-zA-Z_.-]+$/.test(text);
}

// Generate alphanumaric string
function randomString() {
    var result = '';
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = 32; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

// Nodemailer mail sending function
function sendMail(sender, receiver, subject, text) {
    var mailOptions = {
        from: sender,
        to: receiver,
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        }
    });
}

// About us
app.get('/aboutus', function(req, res) {
    res.render('aboutus', {
        curuser: curuser
    });
});

// Admin access
app.get('/admin', ensureAuthenticated, function(req, res) {
    if (adminids.includes(curuser.username)) {
        res.render('admin/admin');
    } else {
        res.render('accessdenied');
    }
});

app.post('/admin', ensureAuthenticated, function(req, res) {
    //console.log(req.body);
    if (req.body.submit == "addproblem") {
        res.redirect('admin/addproblem');
    } else if (req.body.submit == "editproblem") {
        cureditproblem = req.body.problemname;
        res.redirect('admin/editproblem');
    } else if (req.body.submit == "deleteproblem") {
        curdeleteproblem = req.body.problemname;
    } else if (req.body.submit == "addtutorial") {
        res.redirect('admin/addtutorial');
    } else if (req.body.submit == "edittutorial") {
        curedittutorial = req.body.tutorialname;
        res.redirect('admin/edittutorial');
    } else {
        curdeletetutorial = req.body.tutorialname;
        Tutorial.deleteOne({ code: curdeletetutorial })
            .then(() => {
                res.redirect("/admin");
            });
    }
});

// To add problems
app.get('/admin/addproblem', ensureAuthenticated, function(req, res) {
    if (adminids.includes(curuser.username)) {
        res.render('admin/addproblem');
    } else {
        res.render('accessdenied');
    }
});

app.post('/admin/addproblem', ensureAuthenticated, function(req, res) {
    //console.log(req.body);
    const newProblem = {
        name: req.body.name,
        code: req.body.code,
        difficulty: req.body.difficulty,
        statement: req.body.statement,
        constraints: req.body.constraints,
        timelimit: req.body.timelimit,
        sampleinput: req.body.sampleinput,
        sampleoutput: req.body.sampleoutput,
        hiddeninput: req.body.hiddeninput,
        hiddenoutput: req.body.hiddenoutput,
        section: req.body.section,
        tags: req.body.tags,
        solvecount: 0
    };
    new Problem(newProblem)
        .save()
        .then(problem => {
            res.redirect('/admin');
        });
});

// To edit problems
app.get('/admin/editproblem', ensureAuthenticated, function(req, res) {
    //console.log(cureditproblem);
    if (adminids.includes(curuser.username)) {
        Problem.findOne({ code: cureditproblem })
            .lean()
            .then(problems => {
                //console.log(problems);
                res.render('admin/editproblem', {
                    cureditproblem: problems,
                });
            });

    } else {
        res.render('accessdenied');
    }
});

app.post('/admin/editproblem', ensureAuthenticated, function(req, res) {
    Problem.findOne({
            code: cureditproblem
        })
        .then(problems => {
            //console.log(req.body);
            problems.name = req.body.name;
            problems.code = req.body.code;
            problems.difficulty = req.body.difficulty;
            problems.statement = req.body.statement;
            problems.constraints = req.body.constraints;
            problems.timelimit = req.body.timelimit;
            problems.sampleinput = req.body.sampleinput;
            problems.sampleoutput = req.body.sampleoutput;
            problems.hiddeninput = req.body.hiddeninput;
            problems.hiddenoutput = req.body.hiddenoutput;
            problems.section = req.body.section;
            problems.tags = req.body.tags;
            problems.solvecount = req.body.solvecount;
            problems.save()
                .then(problems => {
                    res.redirect('/admin');
                });
        });
});

// To add tutorial
app.get('/admin/addtutorial', ensureAuthenticated, function(req, res) {
    if (adminids.includes(curuser.username)) {
        res.render('admin/addtutorial');
    } else {
        res.render('accessdenied');
    }
});

app.post('/admin/addtutorial', ensureAuthenticated, function(req, res) {
    const newTutorial = {
        name: req.body.name,
        code: req.body.code,
        statement: req.body.statement,
        section: req.body.section
    };
    new Tutorial(newTutorial)
        .save()
        .then(tutorials => {
            res.redirect('/admin');
        });
});

// To edit tutorial
app.get('/admin/edittutorial', ensureAuthenticated, function(req, res) {
    if (adminids.includes(curuser.username)) {
        //console.log(curedittutorial);
        Tutorial.findOne({ code: curedittutorial })
            .then(tutorials => {
                res.render('admin/edittutorial', {
                    curedittutorial: tutorials
                });
            })

    } else {
        res.render('accessdenied');
    }
});

app.post('/admin/edittutorial', ensureAuthenticated, function(req, res) {
    Tutorial.findOne({
            code: curedittutorial
        })
        .then(tutorials => {
            //console.log(req.body);
            tutorials.name = req.body.name;
            tutorials.code = req.body.code;
            tutorials.statement = req.body.statement;
            tutorials.section = req.body.section;
            tutorials.save()
                .then(tutorials => {
                    res.redirect('/admin');
                });
        });
});

// Index route
app.get('/', function(req, res) {
    if (curuser == null) {
        res.render('index');
    } else {
        res.redirect('home');
    }
});

// Contact us
app.get('/contactus', function(req, res) {

    res.render('contactus', {
        curuser: curuser
    })
});

app.post('/contactus', function(req, res) {
    //console.log(req.body);
    var from = req.body.useremail;
    var to = 'infedgelab@gmail.com';
    var subject = "Codebie";
    var text = "Name : " + req.body.username + "\n" + "Email : " + req.body.useremail + "\n" +
        "Subject : " + req.body.usersubject + "\n" + "Message : " + req.body.usermessage;
    sendMail(from, to, subject, text);
    req.flash('success_msg', 'Successful');
    res.redirect('/contactus')
});

// Login/Signup Route
app.get('/enter', function(req, res) {
    if (curuser == null) {
        res.render('enter');
    } else {
        res.redirect('home');
    }
});

// Profile edit
app.get('/editprofile/:id', ensureAuthenticated, function(req, res) {
    if (req.params.id == curuser.username) {
        res.render('editprofile', {
            curuser: curuser
        })
    } else {
        req.flash('error_msg', 'You can not edit this profile');
        res.redirect('/home');
    }
});

app.post('/editprofile/:id', ensureAuthenticated, function(req, res) {
    bcrypt.compare(req.body.userpassword, curuser.password, (err, isMatch) => {
        if (err) {
            throw err
        }
        if (isMatch) {
            if (Object.keys(req.body).length == 2) {
                //console.log(curuser);
                User.findOne({ username: curuser.username })
                    .then(user => {
                        //console.log(user);
                        user.name = req.body.username;
                        user.save();
                        req.flash('success_msg', 'Name Updated');
                        res.redirect('/profile/' + curuser.username);
                    });
            } else {
                //console.log(req.body);
                var errors = [];
                if (req.body.usernewpassword != req.body.usernewpassword2) {
                    errors.push({ text: "Password doesn't match" });
                }
                if (req.body.usernewpassword.length < 6) {
                    errors.push({ text: "Password too short" });
                }
                if (errors.length != 0) {
                    res.render('editprofile', {
                        errors: errors,
                        curuser: req.user
                    });
                } else {
                    bcrypt.genSalt(10, function(err, salt) {
                        bcrypt.hash(req.body.usernewpassword, salt, function(err, hash) {
                            if (err) throw err;
                            User.findOne({ username: curuser.username })
                                .then(user => {
                                    user.password = hash;
                                    user.save();
                                    req.flash('success_msg', 'Password Changed');
                                    res.redirect('/profile/' + curuser.username);
                                });
                        });
                    });
                }
            }
        } else {
            req.flash('error_msg', 'Current Password is incorrect');
            res.redirect('/editprofile/' + curuser.username);
        }
    });
});

// Login Post
app.post('/login', function(req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/enter',
        failureFlash: true
    })(req, res, next);
});

// Register post
app.post('/register', function(req, res) {
    var errors = [];
    console.log(req.body.signupemail);
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

    if (!isValid(req.body.signupusername)) {
        errors.push({ text: "Invalid username" });
    }
    if (req.body.signupusername.length < 6) {
        errors.push({ text: "Username too short, Minimum 6 characters" });
    }
    if (!isValid(req.body.signuppass)) {
        errors.push({ text: "Invalid password" });
    }
    if (req.body.signuppass.length < 6) {
        errors.push({ text: "Password too short, Minimum 6 characters" });
    }
    if (req.body.signuppass != req.body.signuppass2) {
        errors.push({ text: "Password doesn't match" });
    }
    setTimeout(function() {
        if (errors.length != 0) {
            res.render('enter', {
                errors: errors,
                email: req.body.signupemail,
                username: req.body.signupusername
            })
        } else {
            console.log(req.body);
            var info = [];
            info.push(req.body.signupusername);
            info.push(req.body.signupemail);
            info.push(req.body.signuppass);
            var token = randomString();
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
            var text = "Welcome to Codebie! Please click on this link https://codebie-aust.herokuapp.com/token/" + token + " to activate your account. This link will expire after 10 minutes";
            sendMail("codebie.infedgelab@gmail.com", req.body.signupemail, subject, text)
            req.flash('success_msg', 'Registration Successful. An email sent to your inbox with activation link.');
            res.redirect('/enter');
        }
    }, 5000);

});

// Home Route
app.get('/home', function(req, res) {
    // Store number of problems in each sections
    curuser = req.user;
    var tempCounter = getCounter(function(result) {
        counter = result;
        res.render('home', {
            curuser: curuser,
            counter: counter
        });
    });
});

app.post('/home', function(req, res) {
    section = req.body.submit;
    //console.log(section);
    Problem.find({ section: req.body.submit })
        .lean()
        .then(problems => {
            curproblems = problems;
        });
    Tutorial.find({ section: req.body.submit })
        .lean()
        .then(tutorials => {
            curtutorials = tutorials;
        });
    res.redirect('/section/' + section);
});

// Logout route
app.get('/logout', function(req, res) {
    curuser = null;
    req.logout();
    req.flash('success_msg', 'Logged Out');
    res.redirect('/');
});

// Private policy route
app.get('/privatepolicy', function(req, res) {
    res.render('privatepolicy', {
        curuser: curuser
    })
});

// Problem show and submit page
app.get('/problem', function(req, res) {
    console.log(section);
    res.render('problem', {
        curuser: curuser,
        curproblem: curproblem
    });
});

app.post('/problem', ensureAuthenticated, function(req, res) {
    if (req.user) {
        if (req.body.submittedcode.length == 0) {
            verdict = "Compilation Error";
            curtoken = null;
            curoutput = null;
            res.redirect('verdict');
        } else {
            cursubmittedcode = req.body.submittedcode;
            var submission = {
                code: req.body.submittedcode,
                language: req.body.language
            }
            var sampleverdict, hiddenverdict;
            var verdict1 = getverdict(submission, curproblem.sampleinput, curproblem.sampleoutput, function(result) {
                console.log(result);
                sampleverdict = result;
            });
            var verdict2 = getverdict(submission, curproblem.hiddeninput, curproblem.hiddenoutput, function(result) {
                console.log(result);
                hiddenverdict = result;
            });
            setTimeout(function() {
                if (sampleverdict == "Language Rejected") {
                    verdict = "Language Rejected";
                } else if (sampleverdict == "Compilation Error" || hiddenverdict == "Compilation Error") {
                    verdict = "Compilation Error";
                } else if (sampleverdict == "Time Limit" || hiddenverdict == "Time Limit") {
                    verdict = "Time Limit";
                } else if (sampleverdict == "Wrong Answer" || hiddenverdict == "Wrong Answer") {
                    verdict = "Wrong Answer";
                } else {
                    verdict = "Accepted";
                }
                res.redirect('verdict');
            }, 12000);
        }

    } else {
        req.flash('error_msg', 'You must be logged in to submit');
        res.redirect('/enter');
    }
});

// Find problem and redirect to show and submit page
app.get('/problems/:id', function(req, res) {
    Problem.findOne({ code: req.params.id })
        .lean()
        .then(problems => {
            curmysub = [];
            curproblem = problems;
            //console.log(curproblem);
            Submission.find({
                problemcode: curproblem.code
            }).then(submissions => {
                if (curuser) {
                    submissions.forEach(submission => {
                        if (submission.username == curuser.username) {
                            curmysub.push(submission);
                        }
                    })
                }
                selected = {
                    c: "",
                    cpp: "",
                    java: "",
                    py: "",
                }
                if (section == "c") {
                    selected.c = "selected";
                } else if (section == "java") {
                    selected.java = "selected";
                } else if (section == "py") {
                    selected.py = "selected";
                } else {
                    selected.cpp = "selected";
                }
                res.render('problem', {
                    curproblem: curproblem,
                    curuser: curuser,
                    curmysub: curmysub,
                    curallsub: submissions,
                    selected: selected
                });
            });
        });
});

// Profile page
app.get('/profile/:id', function(req, res) {
    //console.log(req.params.id);
    var tempCounter = getCounter(function(result) {
        counter = result;
        User.findOne({ username: req.params.id })
            .then(user => {
                //console.log(user.solved);
                profileCSolve = [];
                profileCppSolve = [];
                profileJavaSolve = [];
                profilePySolve = [];
                profileDsSolve = [];
                profileAlgoSolve = [];
                user.solved.forEach(solve => {
                    if (solve.section == "c") {
                        profileCSolve.push(solve.code);
                    } else if (solve.section == "cpp") {
                        profileCppSolve.push(solve.code);
                    } else if (solve.section == "java") {
                        profileJavaSolve.push(solve.code);
                    } else if (solve.section == "py") {
                        profilePySolve.push(solve.code);
                    } else if (solve.section == "ds") {
                        profileDsSolve.push(solve.code);
                    } else if (solve.section == "algo") {
                        profileAlgoSolve.push(solve.code);
                    }
                });
                res.render('profile', {
                    user: user,
                    curuser: curuser,
                    counter: counter,
                    profileCSolve: profileCSolve,
                    profileCppSolve: profileCppSolve,
                    profileJavaSolve: profileJavaSolve,
                    profilePySolve: profilePySolve,
                    profileDsSolve: profileDsSolve,
                    profileAlgoSolve: profileAlgoSolve,
                    id: req.params.id
                });
            })
    });
});

// Ranklist page
app.get('/ranklist', function(req, res) {
    User.find({})
        .sort({ totalsolvecount: 'desc' })
        .then(user => {
            //console.log(user);
            res.render('ranklist', {
                curuser: curuser,
                user: user
            });
        })
})

// Recent page
app.get('/recent', function(req, res) {
    Submission.find({})
        .sort({ date: 'desc' })
        .limit(20)
        .then(submissions => {
            res.render('recent', {
                curuser: curuser,
                submission: submissions
            });
        })
})



app.get('/resetpass/:id', function(req, res) {
    if (req.user) {
        res.redirect('/home');
    } else {
        res.render('resetpass', {
            id: req.params.id
        });
    }
})

app.post('/resetpass/:id', function(req, res) {
    console.log(req.params.id);
    var errors = [];
    if (req.body.usernewpassword != req.body.usernewpassword2) {
        errors.push({ text: "Password doesn't match" });
    }
    if (req.body.usernewpassword.length < 6) {
        errors.push({ text: "Password too short" });
    }
    if (errors.length != 0) {
        res.render('resetpass', {
            errors: errors
        });
    } else {
        Token.findOne({ token: req.params.id })
            .then(token => {
                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(req.body.usernewpassword, salt, function(err, hash) {
                        if (err) throw err;
                        User.findOne({ email: token.email })
                            .then(user => {
                                user.password = hash;
                                user.save();
                                Token.deleteOne({ token: req.params.id })
                                    .then(() => {
                                        req.flash('success_msg', 'Password Changed');
                                        res.redirect('/enter');
                                    });
                            });
                    });
                });
            });
    }
})

// Show section route
app.get('/section/:id', function(req, res) {
    Tutorial.find({ section: req.params.id })
        .lean()
        .then(tutorials => {
            curtutorials = tutorials;
            Problem.find({ section: req.params.id })
                .lean()
                .then(problems => {
                    curproblems = problems;
                    // Seperating solved and non solved problems
                    var mysolvedcode = [];
                    cursolvedproblems = [];
                    curnotsolvedproblems = [];
                    if (curuser) {
                        curuser.solved.forEach(solve => {
                            if (solve.section == section) {
                                mysolvedcode.push(solve.code)
                            }
                        });
                        if (curproblems) {
                            curproblems.forEach(problem => {
                                if (mysolvedcode.includes(problem.code)) {
                                    cursolvedproblems.push(problem);
                                } else {
                                    curnotsolvedproblems.push(problem);
                                }
                            });
                        }
                    } else {
                        if (curproblems) {
                            curproblems.forEach(problem => {
                                curnotsolvedproblems.push(problem);
                            });
                        }
                    }
                    res.render('section', {
                        curuser: curuser,
                        cursolvedproblems: cursolvedproblems,
                        curnotsolvedproblems: curnotsolvedproblems,
                        curtutorials: curtutorials
                    });
                });
        });
});

// View submission
app.get('/submission/:id', ensureAuthenticated, function(req, res) {
    //console.log(curuser);
    Submission.findOne({ token: req.params.id })
        .then(submission => {
            //console.log(submission);
            alreadysolved = false;
            curuser.solved.forEach(solve => {
                if (solve.code == submission.problemcode) {
                    alreadysolved = true;
                }
            });
            //console.log(submission);
            res.render('submission', {
                curuser: curuser,
                submission: submission,
                alreadysolved: alreadysolved
            });
        })
});

// Token route
app.get('/token/:id', function(req, res) {
    console.log(req.params.id);
    if (req.user) {
        res.redirect('/home');
    } else {
        Token.findOne({
                token: req.params.id
            })
            .then(tokens => {
                if (tokens) {
                    if (tokens.purpose == "resetpass") {
                        res.redirect('/resetpass/' + req.params.id);
                    } else if (tokens.purpose == "activation") {
                        var temp = [];
                        tokens.info.forEach(token => {
                            temp.push(token);
                        })
                        const newUser = new User({
                            username: temp[0],
                            email: temp[1],
                            password: temp[2]
                        });
                        bcrypt.genSalt(10, function(err, salt) {
                            bcrypt.hash(newUser.password, salt, function(err, hash) {
                                if (err) {
                                    throw err;
                                } else {
                                    newUser.password = hash;
                                    newUser
                                        .save()
                                        .then((user) => {
                                            Token.deleteOne({ token: req.params.id })
                                                .then(() => {
                                                    req.flash('success_msg', 'Account activation Successful.');
                                                    res.redirect('/enter');
                                                });
                                        })
                                        .catch((err) => {
                                            console.log(err);
                                            return;
                                        });
                                }
                            });
                        });
                    }
                } else {
                    req.flash('error_msg', 'Token expired');
                    res.redirect('/enter');
                }
            })
    }
});

// Troubleshooting
app.get('/troubleshoot', function(req, res) {
    if (req.user) {
        res.redirect('/home');
    } else {
        res.render('troubleshoot');
    }
});

app.post('/troubleshoot', function(req, res) {
    //console.log(req.body);
    User.findOne({ email: req.body.useremail })
        .then(user => {
            if (user) {
                Token.findOne({
                        email: req.body.useremail,
                        purpose: "resetpass"
                    })
                    .then(tokens => {
                        if (tokens) {
                            console.log(tokens);
                            req.flash('error_msg', 'A password reset token already exists. Please wait for a few minutes.');
                            res.redirect('/enter');
                        } else {
                            var token = randomString();
                            var temp = {
                                createdAt: new Date(),
                                token: token,
                                purpose: "resetpass",
                                email: req.body.useremail
                            };
                            dbo.collection("tokens").insertOne(temp, (err, doc) => {
                                if (!err)
                                    console.log('Token inserted');
                            });
                            var subject = "Codebie Password Reset"
                            var text = "Greetings from Codebie! Click on this link https://codebie-aust.herokuapp.com/token/" + token + " to reset your password. This link will expire after 10 minutes";
                            sendMail("codebie.infedgelab@gmail.com", req.body.useremail, subject, text)
                            req.flash('success_msg', 'An email sent to your inbox with password reset link. Please check spam folder also');
                            res.redirect('/enter');
                        }
                    });

            } else {
                req.flash('error_msg', 'Email not registered');
                res.redirect('/enter');
            }
        })
});

// Tutorial page
app.get('/tutorial', ensureAuthenticated, function(req, res) {
    res.render('tutorial', {
        curuser: curuser,
        curtutorial: curtutorial
    });
})


// Find and show tutorial
app.get('/tutorials/:id', function(req, res) {
    //console.log(req.params);
    Tutorial.findOne({ code: req.params.id })
        .lean()
        .then(tutorial => {
            //console.log(tutorial);
            curtutorial = tutorial;
            Tutorial.find({ section: curtutorial.section })
                .then(tutorials => {
                    res.render('tutorial', {
                        curuser: curuser,
                        curtutorial: tutorial,
                        cursectiontutorials: tutorials
                    });
                })
        });
});

// Verdict route
app.get('/verdict', ensureAuthenticated, function(req, res) {
    //console.log(section);
    if (curoutput == null) {
        if (curtoken) {
            const newSubmission = {
                username: curuser.username,
                problemcode: curproblem.code,
                token: curtoken,
                verdict: verdict,
                section: section,
                stdin: cursubmittedcode,
                lang: curlang
            }
            new Submission(newSubmission).save()
        }
    } else {
        User.findOne({
                username: curuser.username
            })
            .then(user => {
                var alreadysolved = false;
                if (verdict == "Accepted") {
                    user.solved.forEach(solve => {
                        if (solve.code == curproblem.code) {
                            alreadysolved = true;
                        }
                    });
                    if (alreadysolved == false) {
                        if (section == "c") {
                            user.csolvecount++;
                        } else if (section == "cpp") {
                            user.cppsolvecount++;
                        } else if (section == "java") {
                            user.javasolvecount++;
                        } else if (section == "py") {
                            user.pysolvecount++;
                        } else if (section == "ds") {
                            user.dssolvecount++;
                        } else if (section == "algo") {
                            user.algosolvecount++;
                        }
                        user.totalsolvecount++;
                        const newSolved = {
                            code: curproblem.code,
                            section: section
                        }
                        user.solved.unshift(newSolved);
                        user.save();
                        curuser = user;
                    }
                    Problem.findOne({
                            code: curproblem.code
                        })
                        .then(problems => {
                            problems.solvecount++;
                            problems.save()
                        });
                }
                //console.log(curoutput);
                const newSubmission = {
                    username: curuser.username,
                    problemcode: curproblem.code,
                    token: curtoken,
                    verdict: verdict,
                    time: curoutput.time,
                    section: section,
                    stdin: cursubmittedcode,
                    lang: curlang
                }
                new Submission(newSubmission).save()
            });
    }
    var color = "red";
    if (verdict == "Accepted") {
        color = "green";
    }
    //console.log(curoutput);
    res.render('verdict', {
        curuser: curuser,
        verdict: verdict,
        curoutput: curoutput,
        color: color
    });
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("Server started");
});