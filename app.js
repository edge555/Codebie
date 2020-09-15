const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const Handlebars = require('handlebars');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const { exec } = require("child_process");
const fs = require('fs');
const unirest = require('unirest');

var ids = [],
    cursolvedproblems = [],
    curnotsolvedproblems = [];
var section, curuser, curlang, verdict;
var curproblem, curproblems, curtutorial, curtutorials;
var curtoken, cureditproblem, curedittutorial;
var curdeleteproblem, curdeletetutorial, curoutput;
var curmysub, curallsub, cursubmittedcode;

// Connect to mongoose
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/codebie', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Load Models
require('./models/User');
const User = mongoose.model('users');
require('./models/Problem');
const Problem = mongoose.model('problems');
require('./models/Tutorial');
const Tutorial = mongoose.model('tutorials');
require('./models/Submission');
const Submission = mongoose.model('submissions');

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Express session
app.use(session({ secret: 'mySecret', resave: false, saveUninitialized: false }));

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
                "%": lvalue % rvalue
            }[operator];
        }
    }
}));

app.set('view engine', 'handlebars');

// To use public folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(function(req, res, next) {
    next();
});

// About us
app.get('/aboutus', function(req, res) {
    res.render('aboutus', {
        curuser: curuser
    });
});

// Admin access
app.get('/admin', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else if (curuser.username == "edge555") {
        res.render('admin/admin');
    } else {
        res.render('accessdenied');
    }
});

app.post('/admin', function(req, res) {
    //console.log(req.body);
    if (req.body.submit == "addproblem") {
        res.redirect('adminaddproblem');
    } else if (req.body.submit == "editproblem") {
        cureditproblem = req.body.problemname;
        res.redirect('admineditproblem');
    } else if (req.body.submit == "deleteproblem") {
        curdeleteproblem = req.body.problemname;
    } else if (req.body.submit == "addtutorial") {
        res.redirect('adminaddtutorial');
    } else if (req.body.submit == "edittutorial") {
        curedittutorial = req.body.tutorialname;
        res.redirect('adminedittutorial');
    } else {
        curdeletetutorial = req.body.tutorialname;
        Tutorial.deleteOne({ code: curdeletetutorial })
            .then(() => {
                res.redirect("/admin");
            });
    }
});

// To add problems
app.get('/adminaddproblem', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else if (curuser.username == "edge555") {
        res.render('admin/adminaddproblem');
    } else {
        res.render('accessdenied');
    }
});

app.post('/adminaddproblem', function(req, res) {
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
        tags: req.body.tags,
        solvecount: 0
    };
    new Problem(newProblem)
        .save()
        .then(problem => {
            res.redirect('admin');
        });
});

// To edit problems
app.get('/admineditproblem', function(req, res) {
    //console.log(cureditproblem);
    if (curuser == null) {
        res.redirect('enter');
    } else if (curuser.username == "edge555") {
        Problem.findOne({ code: cureditproblem })
            .lean()
            .then(problems => {
                //console.log(problems);
                res.render('admin/admineditproblem', {
                    cureditproblem: problems,
                });
            });

    } else {
        res.render('accessdenied');
    }
});

app.post('/admineditproblem', function(req, res) {
    //console.log("Admin edit problem");
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
            problems.tags = req.body.tags;
            problems.solvecount = req.body.solvecount;
            problems.save()
                .then(problems => {
                    res.redirect('admin');
                });
        });
});

// To add tutorial
app.get('/adminaddtutorial', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else if (curuser.username == "edge555") {
        res.render('admin/adminaddtutorial');
    } else {
        res.render('accessdenied');
    }
});

app.post('/adminaddtutorial', function(req, res) {
    //console.log(req.body);
    const newTutorial = {
        name: req.body.name,
        code: req.body.code,
        statement: req.body.statement,
        tags: req.body.tags
    };
    new Tutorial(newTutorial)
        .save()
        .then(tutorials => {
            res.redirect('admin');
        });
});

// To edit tutorial
app.get('/adminedittutorial', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else if (curuser.username == "edge555") {
        //console.log(curedittutorial);
        Tutorial.findOne({ code: curedittutorial })
            .then(tutorials => {
                res.render('admin/adminedittutorial', {
                    curedittutorial: tutorials
                });
            })

    } else {
        res.render('accessdenied');
    }
});

app.post('/adminedittutorial', function(req, res) {
    console.log("Admin edit tutorial");
    Tutorial.findOne({
            code: curedittutorial
        })
        .then(tutorials => {
            //console.log(req.body);
            tutorials.name = req.body.name;
            tutorials.code = req.body.code;
            tutorials.statement = req.body.statement;
            tutorials.tags = req.body.tags;
            tutorials.save()
                .then(tutorials => {
                    res.redirect('admin');
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

});

// Login/Signup Route
app.get('/enter', function(req, res) {
    if (curuser == null) {
        res.render('enter');
    } else {
        res.redirect('home');
    }
});

app.post('/enter', function(req, res) {
    if (Object.keys(req.body).length == 3) {
        User.findOne({
                username: req.body.signinusername
            })
            .then(user => {
                if (user) {
                    curuser = user;
                    res.redirect('/home');
                } else {
                    // else show error
                }
            });
    } else {
        //console.log(req.body);
        const newUser = {
            username: req.body.signupusername,
            email: req.body.signupemail,
            password: req.body.signuppass,
        };
        new User(newUser)
            .save()
            .then(user => {
                res.redirect('/enter');
            });
        // else show error
    }
});

// Home Route
app.get('/home', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else {
        // Store number of problems in each sections
        counter = {
            ccnt: 0,
            cppcnt: 0,
            javacnt: 0,
            pycnt: 0,
            dscnt: 0,
            algocnt: 0
        }
        Problem.find({})
            .then(problems => {
                //console.log(problems);
                problems.forEach(problem => {
                    //console.log(problem.tags);
                    if (problem.tags == "c") {
                        counter.ccnt++;
                    } else if (problem.tags == "cpp") {
                        counter.cppcnt++;
                    } else if (problem.tags == "java") {
                        counter.javacnt++;
                    } else if (problem.tags == "py") {
                        counter.pycnt++;
                    } else if (problem.tags == "ds") {
                        counter.dscnt++;
                    } else if (problem.tags == "algo") {
                        counter.algocnt++;
                    }
                });
                percentage = {
                        cper: (curuser.csolvecount * 100) / counter.ccnt,
                        cppper: (curuser.cppsolvecount * 100) / counter.cppcnt,
                        javaper: (curuser.javasolvecount * 100) / counter.javacnt,
                        pyper: (curuser.pysolvecount * 100) / counter.pycnt,
                        dsper: (curuser.dssolvecount * 100) / counter.dscnt,
                        algoper: (curuser.algosolvecount * 100) / counter.algocnt
                    }
                    /* console.log(counter);
                    console.log(percentage);
                    console.log(curuser); */
                res.render('home', {
                    curuser: curuser,
                    counter: counter,
                    percentage: percentage
                });
            });
    }
});

app.post('/home', function(req, res) {
    section = req.body.submit;
    Problem.find({ tags: req.body.submit })
        .lean()
        .then(problems => {
            curproblems = problems;
        });
    Tutorial.find({})
        .lean()
        .then(tutorials => {
            curtutorials = tutorials;
        });
    res.redirect('/problems');
});

// Problem show and submit page
app.get('/problem', function(req, res) {
    res.render('problem', {
        curuser: curuser,
        curproblem: curproblem
    });
});

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

function getverdict(submission, input, output, callback) {
    var submissiontoken, tempverdict;
    var token = gettoken(submission, input, function(result) {
        submissiontoken = result;
        curtoken = submissiontoken;
    });
    setTimeout(function() {
        //console.log(submissiontoken);
        var check = getoutput(submissiontoken, function(result) {
            //console.log(result);
            curoutput = result;
            if (section != "algo" && section != "ds" && section != curlang) {
                tempverdict = "Language Rejected";
            } else {
                if (result == "Compilation Error") {
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

app.post('/problem', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    }
    //console.log(curproblem);
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
});

app.get('/problems', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else {
        // Seperating solved and non solved problems
        var mysolvedcode = [];
        cursolvedproblems = [];
        curnotsolvedproblems = [];
        curuser.solved.forEach(solve => {
            if (solve.section == section) {
                mysolvedcode.push(solve.code)
            }
        });
        curproblems.forEach(problem => {
            if (mysolvedcode.includes(problem.code)) {
                cursolvedproblems.push(problem);
            } else {
                curnotsolvedproblems.push(problem);
            }
        });
        res.render('problems', {
            curuser: curuser,
            cursolvedproblems: cursolvedproblems,
            curnotsolvedproblems: curnotsolvedproblems,
            curtutorials: curtutorials
        });
    }
});

app.post('/problems', function(req, res) {
    console.log("Posted from problems");
});

// Find problem and redirect to show and submit page
app.get('/problems/:id', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else {
        setTimeout(function() {
            ids.push(req.params);
            Problem.findOne({ code: ids[0].id })
                .lean()
                .then(problems => {
                    ids = [];
                    curproblem = problems;

                });
        }, 3000);

        setTimeout(function() {
            Submission.find({
                username: curuser.username,
                problemcode: curproblem.code
            }).then(submissions => {
                curmysub = submissions
            });
        }, 7000);

        setTimeout(function() {
            alreadysolved2 = false;
            curuser.solved.forEach(solve => {
                if (solve.code == curproblem.code) {
                    alreadysolved2 = true;
                }
            });
            if (alreadysolved2) {
                Submission.find({
                    problemcode: curproblem.code
                }).then(submissions => {
                    curallsub = submissions
                });
            } else {
                curallsub = null;
            }
        }, 7000);

        setTimeout(function() {
            res.render('problem', {
                curproblem: curproblem,
                curuser: curuser,
                curmysub: curmysub,
                curallsub: curallsub
            });

        }, 9000);
    }
});

// Show solution
app.get('/problems/viewsolution/:id', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else {
        //console.log(req.params);
        Submission.findOne({ token: req.params.id })
            .then(submission => {
                //console.log(submission);
                res.render('viewsolution', {
                    curuser: curuser,
                    submission: submission
                });
            })
    }
});

// Ranklist page
app.get('/ranklist', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else {
        User.find({})
            .sort({ totalsolvecount: 'desc' })
            .then(user => {
                //console.log(user);
                res.render('ranklist', {
                    curuser: curuser,
                    user: user
                });
            })
    }
})

// Recent page
app.get('/recent', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else {
        res.render('recent', {
            curuser: curuser
        });
    }
})

// Tutorial page
app.get('/tutorial', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else {
        res.render('tutorial', {
            curuser: curuser,
            curtutorial: curtutorial
        });
    }
})

// Find problem and redirect to show and submit page
app.get('/tutorials/:id', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else {
        //console.log(req.params);
        Tutorial.findOne({ code: req.params.id })
            .lean()
            .then(tutorials => {
                curtutorial = tutorials;
                res.render('tutorial', {
                    curuser: curuser,
                    curtutorial: tutorials
                });
            });
    }
});

app.get('/verdict', function(req, res) {
    if (curuser == null) {
        res.redirect('enter');
    } else {
        //console.log(section);
        //console.log(curtoken);
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
                const newSubmission = {
                    username: curuser.username,
                    problemcode: curproblem.code,
                    token: curtoken,
                    verdict: verdict,
                    time: curoutput.time,
                    memory: curoutput.memory / 1024,
                    section: section,
                    stdin: cursubmittedcode,
                    lang: curlang
                }
                new Submission(newSubmission).save()
            });

        var image;
        if (verdict == "Accepted") {
            image = "images/congrats.gif";
        } else {
            image = "images/sorry.gif";
        }
        res.render('verdict', {
            curuser: curuser,
            verdict: verdict,
            curoutput: curoutput,
            image: image
        });
    }
});


app.listen(3000, function() {
    console.log("Server started on port 3000");
});