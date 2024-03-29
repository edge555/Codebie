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
var moment = require('moment-timezone');
const app = express();
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const { exec } = require("child_process");
const fs = require('fs');
const unirest = require('unirest');
const { ensureAuthenticated } = require('./helpers/auth');
require('dotenv').config()
var url, userCount, submissionCount;

// admin vars
var adminids = ["edge555"], myid, mypass;
var cureditproblem, curedittutorial, curdeleteproblem, curdeletetutorial;

// Node mailer email
var transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: process.env.NODEMAILER_MAIL,
        pass: process.env.NODEMAILER_PASS
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
require('./models/Global');
const Global = mongoose.model('globals');

// Passport config
require('./config/passport')(passport);

const db = require('./config/database');
const { userInfo } = require('os');
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
                if (!err){
                    console.log("Index Created");
                }
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
        math: function (lvalue, operator, rvalue) {
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
        prettifyDate: function (timestamp, check) {
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
        ifCond: function (v1, operator, v2, options) {
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
        fullLang: function (lang) {
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
                case 'AC':
                    return "Accepted";
                case 'WA':
                    return "Wrong Answer";
                case 'TL':
                    return "Time Limit";
                case 'RE':
                    return "Runtime Error";
                case 'CE':
                    return "Compilation Error";
                default:
                    return lang;
            }
        },
        breaklines: function (text) {
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
app.use(function (req, res, next) {
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
            problems.forEach(problem => {
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
    var req = unirest("GET", "https://judge0-ce.p.rapidapi.com/submissions/" + submissiontoken);
    req.headers({
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        "x-rapidapi-key": process.env.X_RAPIDAPI_KEY,
        "useQueryString": true
    });
    req.end(function (res) {
        if (res.error) {
            //console.log(res.error);
            var verdict = "CE";
            callback(verdict);
        } else {
            callback(res.body);
        }
    });
}

// Judge0 API call for submitting code
function gettoken(req, submission, input, output, timelimit, callback) {
    // Judge0 API for submitting code
    var req = unirest("POST", "https://judge0-ce.p.rapidapi.com/submissions");
    req.headers({
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        "x-rapidapi-key": process.env.X_RAPIDAPI_KEY,
        "content-type": "application/json",
        "accept": "application/json",
        "useQueryString": true
    });
    /* 
    Language ids:
    C (GCC 9.2.0) : 50,
    C++ (GCC 7.4.0) : 52,
    Java (OpenJDK 8) : 62,
    Python (3.8.1) : 71
    */
    var lang_id;
    if (submission.language == "c") {
        lang_id = 50;
    } else if (submission.language == "cpp") {
        lang_id = 52;
    } else if (submission.language == "java") {
        lang_id = 62;
    } else {
        lang_id = 71;
    }
    req.type("json");
    req.send({
        "language_id": lang_id,
        "source_code": submission.code,
        "stdin": input,
        "expected_output": output,
        "cpu_time_limit": timelimit
    });
    req.end(function (res) {
        if (res.error) {
            console.log(res.error);
        } else{
            console.log(res.body);
            var temp = [];
            temp.push(res.body.token);
            temp.push(submission.language);
            callback(temp);
        }
    });
}

// Get verdict
function getverdict(req, submission, input, output, tc, callback) {
    var submissiontoken, tempverdict;
    var temp2 = [];
    var token = gettoken(req, submission, input, output, req.session.curproblem.timelimit, function (result) {
        // result = [submissiontoken,curlang]
        submissiontoken = result[0];
        temp2.push(result[1]);
        temp2.push(submissiontoken);
    });
    setTimeout(function () {
        var check = getoutput(submissiontoken, function (result) {
            /*
            result.status ids
            3 = AC
            4 = WA
            5 = TLE
            6 = CE
            7 - 12 = RTE
            */
            console.log(result);
            if (result == "CE") {
                const dummyVerd = {
                    stdout: '',
                    time: '0',
                    memory: 0,
                    stderr: null,
                    token: temp2[1],
                    compile_output: null,
                    message: null,
                    status: { id: 6, description: 'Runtime Error' }
                }
                temp2.push(dummyVerd);
                tempverdict = tc + " CE";
            } else {
                if (result.status.id == 6) {
                    tempverdict = tc + " CE";
                } else if (result.status.id == 5) {
                    tempverdict = tc + " TL";
                } else if (result.status.id >= 7 && result.status.id <= 12) {
                    tempverdict = tc + " RE";
                } else if (result.status.id == 3) {
                    tempverdict = tc + " AC";
                } else {
                    tempverdict = tc + " WA";
                }
                temp2.push(result);
            }

            var temp = [];
            temp.push(tempverdict, temp2);
            callback(temp);
        });
    }, 7000);
}

// Valid checking regex
function isValid(text) {
    return /^[0-9a-z_.-]+$/.test(text);
}

function isValidPass(text) {
    for (var i = 0; i < text.length; i++) {
        if (text[i] == ' ') {
            return false;
        }
    }
    return true;
}

function getBDTime() {
    var time = moment.tz('Asia/Dhaka');
    return new Date(time);
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
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
    });
}

// About us
app.get('/aboutus', function (req, res) {
    res.render('aboutus', {
        curuser: req.user
    });
});

// Admin access
app.get('/admin', ensureAuthenticated, function (req, res) {
    if (adminids.includes(req.user.username)) {
        res.render('admin/admin');
    } else {
        res.render('accessdenied');
    }
});

app.post('/admin', ensureAuthenticated, function (req, res) {
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
app.get('/admin/addproblem', ensureAuthenticated, function (req, res) {
    if (adminids.includes(req.user.username)) {
        res.render('admin/addproblem');
    } else {
        res.render('accessdenied');
    }
});

app.post('/admin/addproblem', ensureAuthenticated, function (req, res) {
    var testcasecount = req.body.testcasecount;
    var inputs = [], outputs = [];
    for (var i = 0; i < testcasecount; i++) {
        inputs.push(eval(`req.body.input${i}`));
    }
    for (var i = 0; i < testcasecount; i++) {
        outputs.push(eval(`req.body.output${i}`));
    }
    const newProblem = {
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
        inputs: inputs,
        outputs: outputs,
        section: req.body.section,
        tags: req.body.tags,
        solvecount: 0,
        dateAdded: getBDTime()
    };
    new Problem(newProblem)
        .save()
        .then(problem => {
            res.redirect('/admin');
        });
});

// To edit problems
app.get('/admin/editproblem', ensureAuthenticated, function (req, res) {
    if (adminids.includes(req.user.username)) {
        Problem.findOne({ code: cureditproblem })
            .lean()
            .then(problem => {
                res.render('admin/editproblem', {
                    cureditproblem: problem,
                });
            });

    } else {
        res.render('accessdenied');
    }
});

app.post('/admin/editproblem', ensureAuthenticated, function (req, res) {
    Problem.findOne({
        code: cureditproblem
    })
        .then(problems => {
            var testcasecount = req.body.testcasecount;
            var inputs = [], outputs = [];
            for (var i = 0; i < testcasecount; i++) {
                inputs.push(eval(`req.body.input${i}`));
            }
            for (var i = 0; i < testcasecount; i++) {
                outputs.push(eval(`req.body.output${i}`));
            }
            problems.name = req.body.name;
            problems.code = req.body.code;
            problems.difficulty = req.body.difficulty;
            problems.statement = req.body.statement;
            problems.inputformat = req.body.inputformat,
                problems.constraints = req.body.constraints;
            problems.outputformat = req.body.outputformat,
                problems.timelimit = req.body.timelimit;
            problems.testcasecount = req.body.testcasecount;
            problems.samplecount = req.body.samplecount;
            problems.inputs = inputs;
            problems.outputs = outputs;
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
app.get('/admin/addtutorial', ensureAuthenticated, function (req, res) {
    if (adminids.includes(req.user.username)) {
        res.render('admin/addtutorial');
    } else {
        res.render('accessdenied');
    }
});

app.post('/admin/addtutorial', ensureAuthenticated, function (req, res) {
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
app.get('/admin/edittutorial', ensureAuthenticated, function (req, res) {
    if (adminids.includes(req.user.username)) {
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

app.post('/admin/edittutorial', ensureAuthenticated, function (req, res) {
    Tutorial.findOne({
        code: curedittutorial
    })
        .then(tutorials => {
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
app.get('/', function (req, res) {
    if (req.user == null) {
        res.render('index');
    } else {
        res.redirect('home');
    }
});

// Contact us
app.get('/contactus', function (req, res) {
    res.render('contactus', {
        curuser: req.user
    })
});

app.post('/contactus', function (req, res) {
    var from = req.body.useremail;
    var to = process.env.RECEIVER_MAIL;
    var subject = "Codebie";
    var text = "Name : " + req.body.username + "\n" + "Email : " + req.body.useremail + "\n" +
        "Subject : " + req.body.usersubject + "\n" + "Message : " + req.body.usermessage;
    sendMail(from, to, subject, text);
    req.flash('success_msg', 'Successful');
    res.redirect('/contactus')
});

// Login/Signup Route
app.get('/enter', function (req, res) {
    if (req.user == null) {
        res.render('enter', {
            myid: myid,
            mypass: mypass
        });
    } else {
        res.redirect('home');
    }
});

// Profile edit
app.get('/editprofile/:id', ensureAuthenticated, function (req, res) {
    if (req.params.id == req.user.username) {
        res.render('editprofile', {
            curuser: req.user
        })
    } else {
        req.flash('error_msg', 'You can not edit this profile');
        res.redirect('/home');
    }
});

app.post('/editprofile/:id', ensureAuthenticated, function (req, res) {
    bcrypt.compare(req.body.userpassword, req.user.password, (err, isMatch) => {
        if (err) {
            throw err
        }
        if (isMatch) {
            if (Object.keys(req.body).length == 2) {
                User.findOne({ username: req.user.username })
                    .then(user => {
                        user.name = req.body.username;
                        user.save();
                        req.flash('success_msg', 'Name Updated');
                        res.redirect('/profile/' + req.user.username);
                    });
            } else {
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
                    bcrypt.genSalt(10, function (err, salt) {
                        bcrypt.hash(req.body.usernewpassword, salt, function (err, hash) {
                            if (err) throw err;
                            User.findOne({ username: req.user.username })
                                .then(user => {
                                    user.password = hash;
                                    user.save();
                                    req.flash('success_msg', 'Password Changed');
                                    res.redirect('/profile/' + req.user.username);
                                });
                        });
                    });
                }
            }
        } else {
            req.flash('error_msg', 'Current Password is incorrect');
            res.redirect('/editprofile/' + req.user.username);
        }
    });
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
app.post('/register', function (req, res) {
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

    if (!isValid(req.body.signupusername)) {
        errors.push({ text: "Invalid username" });
    }
    if (req.body.signupusername.length < 6) {
        errors.push({ text: "Username too short, Minimum 6 characters" });
    }
    if (!isValidPass(req.body.signuppass)) {
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
            var text = "Welcome to Codebie! Please click on this link http://" + url + "/token/" + token + " to activate your account. This link will expire after 10 minutes.";
            sendMail(process.env.NODEMAILER_MAIL, req.body.signupemail, subject, text)
            req.flash('success_msg', 'Registration Successful. An email will be sent to your inbox with activation link within 3 minutes.');
            res.redirect('/enter');
        }
    }, 8000);
});

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
app.get('/home', function (req, res) {
    // Store number of problems in each sections
    var tempCounter = getCounter(function (result) {
        counter = result;
        res.render('home', {
            curuser: req.user,
            counter: counter,
            userCount: userCount,
            submissionCount: submissionCount
        });
    });
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
app.get('/problem', function (req, res) {
    res.render('problem', {
        curuser: req.user,
        curproblem: req.session.curproblem
    });
});

app.post('/problem', ensureAuthenticated, function (req, res) {
    //console.log(req.params.id);
    if (req.user) {
        if (req.body.submittedcode.length == 0) {
            req.session.verdict = "Compilation Error";
            req.session.curtoken = null;
            req.session.curoutput = null;
            res.redirect('verdict');
        } else {
            Problem.findOne({ code: req.body.probcode })
                .lean()
                .then(problem => {
                    req.session.curproblem = problem;
                    req.session.section = problem.section;
                    var tempLang = req.session.curproblem.section;
                    if (req.session.curproblem.section == 'ds' || req.session.curproblem.section == 'algo') {
                        tempLang = req.body.language;
                    }
                    req.session.cursubmittedcode = req.body.submittedcode;
                    var submission = {
                        code: req.body.submittedcode,
                        language: tempLang
                    }
                    var testcasecount = req.session.curproblem.testcasecount;
                    var inputs = req.session.curproblem.inputs;
                    var outputs = req.session.curproblem.outputs;
                    var temp, tempverdicts = [];
                    for (var i = 0; i < testcasecount; i++) {
                        var verdict1 = getverdict(req, submission, inputs[i], outputs[i], i, function (result) {
                            //console.log(result);
                            if (result[1][2].time != null) {
                                tempverdicts.push(result[0] + " " + result[1][2].time.toString());
                            } else {
                                tempverdicts.push(result[0] + " 0");
                            }
                            temp = result[1];
                        });
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
                        })
                        res.redirect('verdict');
                    }, 10000);
                });
        }
    } else {
        req.flash('error_msg', 'You must be logged in to submit');
        res.redirect('/enter');
    }
});

// Find problem and redirect to show and submit page
app.get('/problems/:id', function (req, res) {
    Problem.findOne({ code: req.params.id })
        .lean()
        .then(problem => {
            //console.log(problem);
            req.session.section = problem.section;
            var curmysub = [];
            var sampleio = [];
            req.session.curproblem = problem;
            for (var i = 0; i < req.session.curproblem.samplecount; i++) {
                sampleio.push([req.session.curproblem.inputs[i], req.session.curproblem.outputs[i]]);
            }
            Submission.find({
                problemcode: req.session.curproblem.code
            })
                .sort({ date: 'desc' })
                .then(submissions => {
                    if (req.user) {
                        submissions.forEach(submission => {
                            if (submission.username == req.user.username) {
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
                    var defaultCode = "#include <bits/stdc++.h>\nusing namespace std;\nint main()\n{\n\n}";
                    if (req.session.section == "c") {
                        selected.c = "selected";
                        defaultCode = "#include <stdio.h>\nint main()\n{\n\n}"
                    } else if (req.session.section == "java") {
                        selected.java = "selected";
                        defaultCode = "import java.util.*;\nclass Main {\n    public static void main(String[] args) {\n      Scanner sc = new Scanner(System.in);\n\n  }\n}"
                    } else if (req.session.section == "py") {
                        selected.py = "selected";
                        defaultCode = "";
                    } else {
                        selected.cpp = "selected";
                    }
                    //console.log(req.session.curproblem);
                    res.render('problem', {
                        curproblem: req.session.curproblem,
                        defaultCode: defaultCode,
                        curuser: req.user,
                        curmysub: curmysub,
                        curallsub: submissions,
                        sampleio: sampleio,
                        selected: selected
                    });
                });
        });
});

// Profile page
app.get('/profile/:id', function (req, res) {
    var tempCounter = getCounter(function (result) {
        counter = result;
        User.findOne({ username: req.params.id })
            .then(user => {
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
                    curuser: req.user,
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
app.get('/ranklist', function (req, res) {
    User.find({})
        .sort({ totalsolvecount: 'desc' })
        .then(users => {
            res.render('ranklist', {
                curuser: req.user,
                user: users
            });
        })
})

// Recent page
app.get('/recent', function (req, res) {
    Submission.find({})
        .sort({ date: 'desc' })
        .limit(20)
        .then(submissions => {
            res.render('recent', {
                curuser: req.user,
                submission: submissions
            });
        })
})

app.get('/resetpass/:id', function (req, res) {
    if (req.user) {
        res.redirect('/home');
    } else {
        res.render('resetpass', {
            id: req.params.id
        });
    }
})

app.post('/resetpass/:id', function (req, res) {
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
                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(req.body.usernewpassword, salt, function (err, hash) {
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
app.get('/section/:id', function (req, res) {
    Tutorial.find({ section: req.params.id })
        .lean()
        .then(tutorials => {
            var curtutorials = tutorials;
            Problem.find({ section: req.params.id })
                .sort({ difficulty: 'asc' })
                .lean()
                .then(problems => {
                    var curproblems = problems;
                    // Seperating solved and non solved problems
                    var mysolvedcode = [];
                    var cursolvedproblems = [];
                    var curnotsolvedproblems = [];
                    if (req.user) {
                        req.user.solved.forEach(solve => {
                            if (solve.section == req.session.section) {
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
                        curuser: req.user,
                        cursolvedproblems: cursolvedproblems,
                        curnotsolvedproblems: curnotsolvedproblems,
                        curtutorials: curtutorials
                    });
                });
        });
});

// View submission
app.get('/submission/:id', ensureAuthenticated, function (req, res) {
    Submission.findOne({ token: req.params.id })
        .then(submission => {
            canSee = false;
            if (submission.username == req.user.username) {
                canSee = true;
            } else {
                req.user.solved.forEach(solve => {
                    if (solve.code == submission.problemcode) {
                        canSee = true;
                    }
                });
            }
            res.render('submission', {
                curuser: req.user,
                submission: submission,
                canSee: canSee
            });
        })
});

// View submission
app.get('/submissions/:id', function (req, res) {
    Submission.find({ username: req.params.id })
        .sort({ date: 'desc' })
        .then(submissions => {
            res.render('submissions', {
                curuser: req.user,
                user: req.params.id,
                submission: submissions
            });
        })
});

// Token route
app.get('/token/:id', function (req, res) {
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
                        bcrypt.genSalt(10, function (err, salt) {
                            bcrypt.hash(newUser.password, salt, function (err, hash) {
                                if (err) {
                                    throw new err;
                                } else {
                                    newUser.password = hash;
                                    newUser.dateJoined = getBDTime();
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
app.get('/troubleshoot', function (req, res) {
    if (req.user) {
        res.redirect('/home');
    } else {
        res.render('troubleshoot');
    }
});

app.post('/troubleshoot', function (req, res) {
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
                            var text = "Greetings from Codebie! Click on this link http://" + url + "/token/" + token + " to reset your password. This link will expire after 10 minutes.";
                            sendMail(process.env.NODEMAILER_MAIL, req.body.useremail, subject, text)
                            req.flash('success_msg', 'An email sent to your inbox with password reset link. Please check spam folder also. This link will expire after 10 minutes.');
                            res.redirect('/enter');
                        }
                    });

            } else {
                req.flash('error_msg', 'Email not registered');
                res.redirect('/enter');
            }
        })
});

// Find and show tutorial
app.get('/tutorials/:id', function (req, res) {
    Tutorial.findOne({ code: req.params.id })
        .lean()
        .then(tutorial => {
            Tutorial.find({ section: tutorial.section })
                .then(tutorials => {
                    res.render('tutorial', {
                        curuser: req.user,
                        curtutorial: tutorial,
                        cursectiontutorials: tutorials
                    });
                })
        });
});

// Verdict route
app.get('/verdict', ensureAuthenticated, function (req, res) {
    var maxtl = 0;
    var nowverdicts = [];
    if (req.session.curoutput == null) {
        if (req.session.curtoken) {
            req.session.verdict = "Compilation Error";
            const newSubmission = {
                username: req.user.username,
                problemname: req.session.curproblem.name,
                problemcode: req.session.curproblem.code,
                token: req.session.curtoken,
                time: 0,
                verdict: req.session.verdict,
                verdicts: nowverdicts,
                section: req.session.section,
                stdin: req.session.cursubmittedcode,
                lang: req.session.curlang,
                date: getBDTime()
            }
            new Submission(newSubmission).save()
        }
    } else {
        User.findOne({
            username: req.user.username
        })
            .then(user => {
                var alreadysolved = false, ce = false, wa = false, tl = false, lr = false, re = false;
                req.session.curverdicts.forEach(cv => {
                    if (cv == "WA") {
                        wa = true;
                    } else if (cv == "CE") {
                        ce = true;
                    } else if (cv == "TL") {
                        tl = true;
                    } else if (cv == "LR") {
                        lr = true;
                    } else if (cv == "RE") {
                        re = true;
                    }
                });
                if (lr == true) {
                    req.session.verdict = "Language Rejected";
                } else if (ce == true) {
                    req.session.verdict = "Compilation Error";
                } else if (re == true) {
                    req.session.verdict = "Runtime Error";
                } else if (tl == true) {
                    req.session.verdict = "Time Limit Exceeded";
                } else if (wa == true) {
                    req.session.verdict = "Wrong Answer";
                } else {
                    req.session.verdict = "Accepted";
                }
                if (req.session.verdict == "Accepted") {
                    user.solved.forEach(solve => {
                        if (solve.code == req.session.curproblem.code) {
                            alreadysolved = true;
                        }
                    });
                    if (alreadysolved == false) {
                        if (req.session.section == "c") {
                            user.csolvecount++;
                        } else if (req.session.section == "cpp") {
                            user.cppsolvecount++;
                        } else if (req.session.section == "java") {
                            user.javasolvecount++;
                        } else if (req.session.section == "py") {
                            user.pysolvecount++;
                        } else if (req.session.section == "ds") {
                            user.dssolvecount++;
                        } else if (req.session.section == "algo") {
                            user.algosolvecount++;
                        }
                        user.totalsolvecount++;
                        const newSolved = {
                            code: req.session.curproblem.code,
                            section: req.session.section
                        }
                        user.solved.unshift(newSolved);
                        user.save();
                    }
                    Problem.findOne({
                        code: req.session.curproblem.code
                    })
                        .then(problems => {
                            problems.solvecount++;
                            problems.save()
                        });
                }

                for (var i = 0; i < req.session.curverdicts.length; i++) {
                    const newVerd = {
                        verdict: req.session.curverdicts[i],
                        time: req.session.curtls[i]
                    }
                    maxtl = Math.max(maxtl, req.session.curtls[i]);
                    nowverdicts.push(newVerd);
                }

                const newSubmission = {
                    username: req.user.username,
                    problemname: req.session.curproblem.name,
                    problemcode: req.session.curproblem.code,
                    token: req.session.curtoken,
                    verdict: req.session.verdict,
                    verdicts: nowverdicts,
                    time: maxtl,
                    section: req.session.section,
                    stdin: req.session.cursubmittedcode,
                    lang: req.session.curlang,
                    date: getBDTime()
                }
                new Submission(newSubmission).save();
            });
    }

    setTimeout(function () {
        var color = "red";
        if (req.session.verdict == "Accepted") {
            color = "green";
        }
        res.render('verdict', {
            curuser: req.user,
            verdict: req.session.verdict,
            curverdicts: req.session.curverdicts,
            curtls: req.session.curtls,
            curoutput: req.session.curoutput,
            maxtl: maxtl,
            color: color
        });
    }, 7000);
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
    if (process.env.NODE_ENV === 'production') {
        url = 'codebie-aust.herokuapp.com';
        myid = "";
        mypass = "";
    } else {
        url = 'localhost:3000';
        myid = "edge555";
        mypass = "abc123";
    }
    console.log("Server started");
});