const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProblemSchema = new Schema({
    name : {
        type : String,
        required:true
    },
    code : {
        type : String,
        required:true
    },
    difficulty : {
        type : String,
        default: 'easy'
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
    tags :{
        type : String
    },
    solvecount : {
        type : Number,
        default : 0
    }
});
mongoose.model('problems',ProblemSchema);