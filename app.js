const express = require('express');
const exphbs = require('express-handlebars');
const app = express();

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