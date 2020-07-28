const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

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

// Handlebars Middleware
app.engine('handlebars', exphbs({
    defaultLayout:'main'
}));
app.set('view engine', 'handlebars');
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
    res.render('practice');
});

app.post('/enter',function(req,res){
    // Check login/signup validity here then direct
    res.send('OK');
});

app.listen(3000,function(){
    console.log("Server started on port 3000");
});