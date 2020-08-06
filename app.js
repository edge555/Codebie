const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const Handlebars = require('handlebars');
const mongoose = require('mongoose');
const app = express();
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const { exec } = require("child_process");
const fs = require('fs');
const unirest = require('unirest');

// Judge0 API
var req = unirest("POST", "https://judge0.p.rapidapi.com/submissions");
req.headers({
	"x-rapidapi-host": "judge0.p.rapidapi.com",
	"x-rapidapi-key": "f29463abbdmsh6850c751a0bc89fp11dfc2jsn113becd1a344",
	"content-type": "application/json",
	"accept": "application/json",
	"useQueryString": true
});

var ids =[],ids2=[];

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
    res.render('admin/admin');
});

app.post('/admin',function(req,res){
    if(req.body.submit=="addproblem"){
        res.redirect('adminaddproblem');
    } else if (req.body.submit=="editproblem"){
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
    res.render('admin/adminaddproblem');
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
    res.render('admin/admineditproblem');
});

app.post('/admineditproblem',function(req,res){
    
});

// To add tutorial
app.get('/adminaddtutorial',function(req,res){
    res.render('admin/adminaddtutorial');
});

app.post('/adminaddtutorial',function(req,res){
    
});

// To edit tutorial
app.get('/adminedittutorial',function(req,res){
    res.render('admin/adminedittutorial');
});

app.post('/adminedittutorial',function(req,res){
    
});

// Index route
app.get('/',function(req,res){
    res.render('index');
});

// About route
app.get('/about',function(req,res){
   res.render('about');
});

// Login/Signup Route
app.get('/enter',function(req,res){
    res.render('enter');
});

app.post('/enter',function(req,res){
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
});

// Practice Route
app.get('/home',function(req,res){
    res.render('home');    
});

// Problem show and submit page
app.get('/problem',function(req,res){
    console.log(req);
    res.render('problem');
});

 // Judge0 API call for submitting code
function gettoken(token,input, callback) {
    // Judge0 API for submitting code
    var req = unirest("POST", "https://judge0.p.rapidapi.com/submissions");
    req.headers({
        "x-rapidapi-host": "judge0.p.rapidapi.com",
        "x-rapidapi-key": "f29463abbdmsh6850c751a0bc89fp11dfc2jsn113becd1a344",
        "content-type": "application/json",
        "accept": "application/json",
        "useQueryString": true
    });
    req.type("json");
    req.send({
        "language_id": 50,
        "source_code": "#include <stdio.h>\n\nint main(void) {\n  char name[10];\n  scanf(\"%s\", name);\n  printf(\"hello %s\\n\", name);\n  return 0;\n}",
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
        if (res.error) 
            throw new Error(res.error);
        console.log(res.body);
    });
}

app.post('/problem',function(req,res){
    // Code Fetched
    var submittedcode = req.body.submittedcode;
    var submissiontoken,usersubmissioncode;
    var judgeinput = "Arthur";
    var token=gettoken(usersubmissioncode,judgeinput, function(result) {
        submissiontoken = result;
    });
    setTimeout(function() {
        //console.log(submissiontoken);
        var check = getoutput(submissiontoken);
    }, 3000);
});

app.get('/problems',function(req,res){
    res.render('problems');
});

app.post('/problems',function(req,res){
    Problem.find({tags:req.body.submit})
        .lean()
        .then(problems =>{
            res.render('problems',{
                problems:problems
            });
        });
});

// Find problem and redirect to show and submit page
app.get('/problems/:id',function(req,res){
    ids.push(req.params);
    Problem.findOne({code : ids[0].id})
        .lean()
        .then(problems =>{
            ids =[];
            res.render('problem',{
                problems : problems
            });
        });
});

// Tutorial and problem list page
app.get('/problem_list',function(req,res){
    res.render('problem_list');
});

app.listen(3000,function(){
    console.log("Server started on port 3000");
});