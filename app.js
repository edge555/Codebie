const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const Handlebars = require('handlebars');
const mongoose = require('mongoose');
const app = express();
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

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