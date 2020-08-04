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

app.get('/problems',function(req,res){
    res.render('problems');
});

app.post('/problems',function(req,res){
    console.log(req.body.submit);
    Problem.find({tags:req.body.submit})
        .lean()
        .then(problems =>{
            res.render('problems',{
                problems:problems
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