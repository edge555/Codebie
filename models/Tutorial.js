const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TutorialSchema = new Schema({
    name : {
        type : String,
        required:true
    },
    code : {
        type : String,
        required:true
    },
    statement : {
        type : String,
        default: 'statement',
        required : true
    },
    tags :{
        type : String
    }
});
mongoose.model('tutorials',TutorialSchema);