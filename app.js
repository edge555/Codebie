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
app.get('/practice',function(req,res){
    // Searching all users
    User.find({})
    .then(users=>{
        res.render('practice',{
            users : users
        });
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

// Dummy submit route
app.get('/dsubmit',function(req,res){
    res.render('dsubmit');
});

// Fetch dummy submit code
app.post('/dsubmit',function(req,res){
    // Code Fetched
    var submittedcode = req.body.submittedcode;
    //console.log(submittedcode);
    // Create code.txt & output.txt
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

app.post('/enter',function(req,res){
    // Check login/signup validity here then direct
    console.log(req.body);
    const newUser = {
        email : req.body.signinemail,
        password : req.body.signinpass
    };
    new User(newUser)
    .save()
    .then(user => {
        res.redirect('/practice');
    });
});

app.listen(3000,function(){
    console.log("Server started on port 3000");
});