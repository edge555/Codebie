const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name : {
        type : String,
        required:true
    }
});
mongoose.model('users',UserSchema);