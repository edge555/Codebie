const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProblemSchema = new Schema({
    name : {
        type : String,
        required:true
    },
    problemcode : {
        type : String,
        required:true
    },
    difficulty : {
        type : String,
        default: 'easy',
        required:true
    },
    statement : {
        type : String,
        default: 'statement',
        required : true
    },
    constraints : {
        type : String,
        default: 'constraints'
    },
    timelimit : {
        type : String,
        default: '1s'
    },
    sampleinput : {
        type : String,
        default : 'sampleinput',
        required : true
    },
    sampleoutput : {
        type : String,
        default : 'sampleoutput',
        required : true
    },
    hiddeninput : {
        type : String,
        default : 'hiddeninput'
    },
    hiddenoutput : {
        type : String,
        default : 'hiddenoutput'
    },
    solvecount : {
        type : Integer,
        default : 0
    }
});
mongoose.model('problems',ProblemSchema);