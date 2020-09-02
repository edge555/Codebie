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

var ids=[];
var curuser,curproblem,curoutput,curproblems,verdict;
var curtoken,cureditproblem,curedittutorial;

// Connect to mongoose
mongoose.Promise=global.Promise;
mongoose.connect('mongodb://localhost/codebie',{
    useNewUrlParser: true,
    useUnifiedTopology : true
})
.then(()=> console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Load Models
require('./models/User');
const User = mongoose.model('users');
require('./models/Problem');
const Problem = mongoose.model('problems');

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Express session
app.use(session({secret: 'mySecret', resave: false, saveUninitialized: false}));

// Handlebars Middleware
app.engine('handlebars', exphbs({
    defaultLayout:'main',
    handlebars: allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', 'handlebars');

// To use public folder
app.use(express.static(path.join(__dirname,'public')));

// Middleware
app.use(function(req,res,next){
    next();
});

// Admin access
app.get('/admin',function(req,res){
    if(curuser==null){
        res.redirect('enter');
    }
    else if(curuser.username=="edge555"){
        res.render('admin/admin');
    } else {
        res.render('accessdenied');
    }
});

app.post('/admin',function(req,res){
    //console.log(req.body);
    if(req.body.submit=="addproblem"){
        res.redirect('adminaddproblem');
    } else if (req.body.submit=="editproblem"){
        cureditproblem=req.body.problemname;
        res.redirect('admineditproblem');
    } else if (req.body.submit=="addtutorial"){
        res.redirect('adminaddtutorial');
    } 
    else {
        res.redirect('adminedittutorial');
    }
});

// To add problems
app.get('/adminaddproblem',function(req,res){
    if(curuser==null){
        res.redirect('enter');
    }
    else if(curuser.username=="edge555"){
        res.render('admin/adminaddproblem');
    } else {
        res.render('accessdenied');
    }
});

app.post('/adminaddproblem',function(req,res){
    console.log(req.body);
    const newProblem = {
        name : req.body.name,
        code : req.body.code,
        difficulty : req.body.difficulty,
        statement: req.body.statement,
        constraints: req.body.constraints,
        timelimit: req.body.timelimit,
        sampleinput : req.body.sampleinput ,
        sampleoutput : req.body.sampleoutput ,
        hiddeninput : req.body.hiddeninput ,
        hiddenoutput : req.body.hiddenoutput ,
        tags: req.body.tags,
        solvecount : 0
    };
    new Problem(newProblem)
    .save()
    .then(problem => {
        res.redirect('admin');
    }); 
});

// To edit problems
app.get('/admineditproblem',function(req,res){
    console.log(cureditproblem);
    if(curuser==null){
        res.redirect('enter');
    }
    else if(curuser.username=="edge555"){
        Problem.findOne({code : cureditproblem})
        .lean()
        .then(problems =>{
            //console.log(problems);
            res.render('admin/admineditproblem',{
                cureditproblem : problems,
            });
        });
        
    } else {
        res.render('accessdenied');
    }
});

app.post('/admineditproblem',function(req,res){
    console.log("Admin edit problem");
    Problem.findOne({
        code:cureditproblem
    })
    .then(problems=>{
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
        .then(notes=>{
            res.redirect('admin');
        });
    });
});

// To add tutorial
app.get('/adminaddtutorial',function(req,res){
    if(curuser==null){
        res.redirect('enter');
    }
    else if(curuser.username=="edge555"){
        res.render('admin/adminaddtutorial');
    } else {
        res.render('accessdenied');
    }
});

app.post('/adminaddtutorial',function(req,res){
    
});

// To edit tutorial
app.get('/adminedittutorial',function(req,res){
    if(curuser==null){
        res.redirect('enter');
    }
    else if(curuser.username=="edge555"){
        res.render('admin/adminedittutorial');
    } else {
        res.render('accessdenied');
    }
});

app.post('/adminedittutorial',function(req,res){
    
});

// Index route
app.get('/',function(req,res){
    if(curuser==null){
        res.render('index');
    } else {
        res.redirect('home');
    }
});

// About route
app.get('/about',function(req,res){
    if(curuser==null){
        res.redirect('enter');
    } else {
        res.render('about');
    }
});

// Login/Signup Route
app.get('/enter',function(req,res){
    if(curuser==null){
        res.render('enter');
    } else {
        res.redirect('home');
    }
});

app.post('/enter',function(req,res){
    if(Object.keys(req.body).length==3){
        User.findOne({
            username : req.body.signinusername
        })
        .then(user =>{
            if(user){
                curuser = user;
                res.redirect('/home');
            } else {
                // else show error
            }
        });
    } else {
        const newUser = {
            username : req.body.signupusername,
            email : req.body.signupemail,
            password : req.body.signuppass,
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
app.get('/home',function(req,res){
    if(curuser==null){
        res.redirect('enter');
    } else {
        console.log(curuser);
        res.render('home', {curuser: curuser});
    }
});

app.post('/home',function(req,res){
    Problem.find({tags:req.body.submit})
        .lean()
        .then(problems =>{
            curproblems = problems;
            res.redirect('/problems');
        });
});

// Problem show and submit page
app.get('/problem',function(req,res){
    res.render('problem',{
        curuser:curuser,
        curproblem:curproblem
    });
});

 // Judge0 API call for submitting code
function gettoken(submission,input, callback) {
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
    if(submission.language=="c"){
        lang_id = 50;
    } else if(submission.language=="cpp"){
        lang_id = 52;
    } else if(submission.language=="java"){
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
    req.end(function (res) {
        if (res.error) 
            throw new Error(res.error);
        callback(res.body.token);
    }); 
}

 // Judge0 API call to get execution info
function getoutput(submissiontoken, callback) {
    console.log(submissiontoken);
    var req = unirest("GET", "https://judge0.p.rapidapi.com/submissions/"+submissiontoken);
    req.headers({
        "x-rapidapi-host": "judge0.p.rapidapi.com",
        "x-rapidapi-key": "f29463abbdmsh6850c751a0bc89fp11dfc2jsn113becd1a344",
        "useQueryString": true
    });
    req.end(function (res) {
        if (res.error) {
            //throw new Error(res.error);
            verdict="Compilation Error";
            callback(verdict);
            //console.log("Compiler error");
        } else {
            //console.log(res.body);
            callback(res.body);
        }
    });
}

app.post('/problem',function(req,res){
    //console.log(curproblem);
    // Code Fetched
    var submission = {
        code : req.body.submittedcode,
        language : req.body.language
    };
    var submissiontoken;
    var judgeinput = curproblem.sampleinput;
    var token=gettoken(submission,judgeinput, function(result) {
        submissiontoken = result;
        curtoken = submissiontoken;
    });
    setTimeout(function() {
        //console.log(submissiontoken);
        var check=getoutput(submissiontoken,function(result) {
            //console.log(result);
            curoutput=result;
            if(result=="Compilation Error"){
                verdict=result;
            } else {
                 if(curoutput.time>curproblem.timelimit){
                    verdict="Time Limit";
                }
                else if(curoutput.stdout==curproblem.sampleoutput){
                    verdict = "Accepted";
                } else {
                    verdict = "Wrong Answer";
                }
            }
            res.redirect('verdict');
        });
    }, 5000);
});

app.get('/problems',function(req,res){
    if(curuser==null){
        res.redirect('enter');
    } else {
        //console.log(curproblems);
        res.render('problems', {
            curuser : curuser,
            curproblems: curproblems
        });
    }
});

app.post('/problems',function(req,res){
    console.log("Posted from problems");
});

// Find problem and redirect to show and submit page
app.get('/problems/:id',function(req,res){
    ids.push(req.params);
    Problem.findOne({code : ids[0].id})
        .lean()
        .then(problems =>{
            ids =[];
            curproblem = problems;
            res.render('problem',{
                curproblem : problems,
                curuser : curuser
            });
        });
});

app.get('/verdict',function(req,res){
    if(curuser==null){
        res.redirect('enter');
    } else {
        var alreadysolved=false;
        if(verdict=="Accepted"){
            console.log("Verdict get");
            //console.log(curtoken);
            User.findOne({
                username : curuser.username
            })
            .then(user =>{
                user.cppsolved.forEach(solve => {
                    if(solve.problemcode==curproblem.code){
                        alreadysolved = true;
                    }
                    //console.log(solve.problemcode);
                });
                if(alreadysolved){
                    user.cppsolvecount++;
                } 
                const newSolve = {
                    problemcode : curproblem.code,
                    token : curtoken
                }
                user.cppsolved.unshift(newSolve); // add to beginning
                user.save()
                .then(user =>{
                    res.render('verdict',{
                        verdict : verdict,
                        curoutput : curoutput
                    });
                });
            });
        } else {
            res.render('verdict',{
                verdict : verdict,
                curoutput : curoutput
            });
        }
    }
});

app.listen(3000,function(){
    console.log("Server started on port 3000");
});