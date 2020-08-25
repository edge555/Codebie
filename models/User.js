const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username : {
        type : String,
        required:true
    },
    email : {
        type : String,
        required:true
    },
    password : {
        type : String,
        required:true,
        default: 'password'
    },
    name : {
        type : String,
        required:true,
        default : 'name'
    },
    csolved:{
        type : Number,
        default : 0
    },
    cppsolved:{
        type : Number,
        default : 0
    },
    javasolved:{
        type : Number,
        default : 0
    },
    pysolved:{
        type : Number,
        default : 0
    },
    dssolved:{
        type : Number,
        default : 0
    },
    algosolved:{
        type : Number,
        default : 0
    }
});
mongoose.model('users',UserSchema);