const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProblemSchema = new Schema({
    name : {
        type : String,
        required:true
    },
    statement : {
        type : String,
        default: 'statement'
    },
    constraints : {
        type : String,
        required : true
    },
    input : {
        type : String,
        default : 'input'
    },
    output : {
        type : String,
        default : 'output'
    },
    solvecount : {
        type : Integer,
        default : 0
    }
});
mongoose.model('problems',ProblemSchema);