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

// Connect to mongoose
mongoose.Promise=global.Promise;
mongoose.connect('mongodb://localhost/codebie',{
    useNewUrlParser: true,
    useUnifiedTopology : true
})
.then(()=> console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Load User Model
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

// Function to run cmd commands
var runcmd = (command)=>{
    exec(command, (error, stdout, stderr) => {
        if (error) {
            return "error";
        }
        else if (stderr) {
            return "stderr";
        }
        else{
            return "success";
        }
    });
};

var deletefiles = ()=>{
    runcmd("del code.txt");
    runcmd("del code.cpp");
    runcmd("del code.exe");
    runcmd("del useroutput.txt");
    runcmd("del judgeoutput.txt");
};

var generateoutput = ()=>{
    runcmd("code.exe < input.txt > useroutput.txt");
};

app.get('/admin',function(req,res){
    res.render('admin');
});

app.post('/admin',function(req,res){
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
        solvecount : 0
    };
    new Problem(newProblem)
    .save()
    .then(problem => {
        res.redirect('/practice');
    }); 
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

// Practice Route
app.get('/home',function(req,res){
    res.render('home');    
});

app.post('/home',function(req,res){
    User.findOne({
        username : req.body.signinusername
    })
    .then(user =>{
        if(user){
            res.render('home',{
                user:user
            });
        } else {
            console.log("Not found");
        }
    });
});

// Problem show and submit page
app.get('/problem',function(req,res){
    res.render('problem');
});

app.post('/problem',function(req,res){
    // Code Fetched
    var submittedcode = req.body.submittedcode;
    // Create code.txt
    runcmd("type nul > code.txt");
    // Check if code.txt not exists
    try {
        const path = 'code.txt';
        if (fs.existsSync(path)) {
            
        } else {
            runcmd("type nul > code.txt");
        }
      } catch(err) {
        console.error(err);
    }
    
    // Create and write to code.txt
    try {
        fs.appendFile('code.txt', submittedcode, function (err) {
            if (err) {
                
            } else {
                // Change extension to .cpp
                fs.renameSync('code.txt', 'code.cpp');
            }
        });
      } catch(err) {
        console.error(err);
    }
    // Fetch input.txt and judgeoutput.txt from database

    // Compile code.cpp
    runcmd("g++ -o code code.cpp");
    // run code.exe with input.txt and store output in output.txt
    generateoutput();
    setTimeout(generateoutput,5000);
    // Match outputs
    var useroutput = null;
    setTimeout(function() {
        useroutput = fs.readFileSync('useroutput.txt','utf8');
        judgeoutput = fs.readFileSync('judgeoutput.txt','utf8');
        // Match outputs
        if(useroutput===judgeoutput){
            console.log("Yes");
        } else {
            console.log("No");
        }
    }, 8000);
    // Delete files after verdict complete
    //setTimeout(deletefiles,8000);
});

// Tutorial and problem list page
app.get('/problem_list',function(req,res){
    res.render('problem_list');
});

app.get('/problems',function(req,res){
    res.render('problems');
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

app.listen(3000,function(){
    console.log("Server started on port 3000");
});