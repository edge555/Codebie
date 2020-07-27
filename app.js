const express = require('express');
const exphbs = require('express-handlebars');
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
const User = mongoose.model('users')

// Handlebars Middleware
app.engine('handlebars', exphbs({
    defaultLayout:'main'
}));
app.set('view engine', 'handlebars');

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

app.listen(3000,function(){
    console.log("Server started on port 3000");
});