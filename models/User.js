const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email : {
        type : String,
        required:true
    },
    password : {
        type : String,
        default: 'password'
    },
    name : {
        type : String,
        default : 'name'
    }
});
mongoose.model('users',UserSchema);